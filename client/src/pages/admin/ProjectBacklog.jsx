import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  getTasks, 
  createTask, 
  getSprints, 
  addIssueToSprint, 
  createSprint, 
  updateSprint, 
  getEmployees,
  updateTask,
  uploadAttachmentToTask,
  addCommentToTask
} from '../../services/api';
import IssuePopup from '../../components/IssuePopup';

const ProjectBacklog = () => {
  const { id: projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [sprintTitle, setSprintTitle] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [sprintDuration, setSprintDuration] = useState(2);
  const [sprintStart, setSprintStart] = useState('');
  const [sprintEnd, setSprintEnd] = useState('');
  const [addingIssueSprintId, setAddingIssueSprintId] = useState(null);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueTimeline, setNewIssueTimeline] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null); // <-- Popup state
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);

  // Load user from localStorage safely
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);

  // Fetch tasks and sprints when projectId changes
  const fetchBacklog = useCallback(async () => {
    setLoading(true);
    try {
      const allTasks = await getTasks(projectId);
      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchSprints = useCallback(async () => {
    try {
      const sprintsData = await getSprints(projectId);
      setSprints(sprintsData || []);
    } catch (error) {
      console.error('Error fetching sprints:', error);
    }
  }, [projectId]);

  // Initial data load
  useEffect(() => {
    fetchBacklog();
    fetchSprints();
  }, [fetchBacklog, fetchSprints]);

  // Handle task update from the popup
  const handleTaskUpdate = useCallback((updatedTask) => {
    // Update the tasks list
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      )
    );
    
    // Update the selected issue if it's the one being updated
    if (selectedIssue && selectedIssue._id === updatedTask._id) {
      setSelectedIssue(updatedTask);
    }
    
    // Close the popup after a short delay to show the update
    setTimeout(() => {
      setSelectedIssue(null);
    }, 500);
    
    // Refresh the backlog and sprints
    fetchBacklog();
    fetchSprints();
  }, [selectedIssue, fetchBacklog, fetchSprints]);
  
  // Handle creating a new task
  const handleCreateTask = async (taskData) => {
    try {
      const newTask = await createTask({
        ...taskData,
        project: projectId,
        status: 'Todo',
        priority: taskData.priority || 'Medium'
      });
      
      // If the task is added to a sprint, update the sprint
      if (taskData.sprint) {
        await addIssueToSprint(taskData.sprint, newTask._id);
      }
      
      // Refresh the tasks and sprints
      await Promise.all([fetchBacklog(), fetchSprints()]);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  // Sprint creation
  const handleCreateSprint = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    if (!sprintTitle || !sprintDuration || !sprintStart || !sprintEnd || !user?.company) return;
    await createSprint({
      title: sprintTitle,
      goal: sprintGoal,
      duration: sprintDuration,
      project: projectId,
      startDate: sprintStart,
      endDate: sprintEnd,
      company: user.company
    });
    setSprintTitle('');
    setSprintGoal('');
    setSprintDuration(2);
    setSprintStart('');
    setSprintEnd('');
    setShowSprintForm(false);
    fetchSprints();
  };

  // handleAddIssueToSprint is already defined above with enhanced functionality

  // Memoize issues not in any sprint (backlog)
  const backlogIssues = React.useMemo(() => 
    (Array.isArray(tasks) ? tasks : []).filter(task => task && !task.sprint),
    [tasks]
  );

  // Memoize issues by sprint
  const issuesBySprint = React.useMemo(() => {
    if (!Array.isArray(sprints) || !Array.isArray(tasks)) {
      return {};
    }
    return sprints.reduce((acc, sprint) => {
      if (sprint && sprint._id) {
        acc[sprint._id] = tasks.filter(task => 
          task && task.sprint && String(task.sprint._id || task.sprint) === String(sprint._id)
        );
      }
      return acc;
    }, {});
  }, [sprints, tasks]);
  
  // Get active and completed sprints
  const { activeSprints, completedSprints } = React.useMemo(() => {
    const active = [];
    const completed = [];
    
    if (Array.isArray(sprints)) {
      sprints.forEach(sprint => {
        if (!sprint) return;
        if (sprint.status === 'Completed') {
          completed.push(sprint);
        } else {
          active.push(sprint);
        }
      });
      
      // Sort active sprints: started first, then created/planned
      active.sort((a, b) => {
        if (!a || !b) return 0;
        if (a.status === 'Started' && b.status !== 'Started') return -1;
        if (a.status !== 'Started' && b.status === 'Started') return 1;
        return 0;
      });
    }
    
    return { activeSprints: active || [], completedSprints: completed || [] };
  }, [sprints]);

  // Sprint status update handler
  const handleSprintStatus = async (sprint) => {
    try {
      let nextStatus = '';
      if (sprint.status === 'Planned' || sprint.status === 'Created') nextStatus = 'Started';
      else if (sprint.status === 'Started') nextStatus = 'Completed';
      else return;
      
      await updateSprint(sprint._id, { status: nextStatus });
      
      // Refresh data
      await Promise.all([fetchSprints(), fetchBacklog()]);
    } catch (error) {
      console.error('Error updating sprint status:', error);
    }
  };
  
  // Handle adding a new issue to a sprint
  const handleAddIssueToSprint = async (e, sprintId) => {
    e.preventDefault();
    if (!newIssueTitle.trim()) return;
    
    try {
      // Create the task
      const created = await handleCreateTask({
        title: newIssueTitle,
        sprint: sprintId,
        plannedDateStart: newIssueTimeline || undefined,
      });
      
      // Reset form
      setNewIssueTitle('');
      setNewIssueTimeline('');
      setAddingIssueSprintId(null);
      
      // Open the new task in the popup
      setSelectedIssue(created);
    } catch (error) {
      console.error('Error adding issue to sprint:', error);
    }
  };

  // Render a single sprint column
  const renderSprintColumn = (sprint) => (
    <div key={sprint._id} className="bg-white rounded-lg shadow overflow-hidden mb-4">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="font-semibold">{sprint.title}</h3>
        <p className="text-sm text-gray-600">{sprint.goal}</p>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>{new Date(sprint.startDate).toLocaleDateString()}</span>
          <span>to</span>
          <span>{new Date(sprint.endDate).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-4">
          {addingIssueSprintId === sprint._id ? (
            <form onSubmit={(e) => handleAddIssueToSprint(e, sprint._id)} className="mb-3">
              <input
                type="text"
                value={newIssueTitle}
                onChange={(e) => setNewIssueTitle(e.target.value)}
                className="w-full p-2 border rounded text-sm mb-2"
                placeholder="New issue title"
                autoFocus
              />
              <div className="flex justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  disabled={!newIssueTitle.trim()}
                >
                  Add Issue
                </button>
                <button
                  type="button"
                  onClick={() => setAddingIssueSprintId(null)}
                  className="text-gray-500 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAddingIssueSprintId(sprint._id)}
              className="text-sm text-blue-500 hover:text-blue-700 mb-2"
            >
              + Add Issue
            </button>
          )}
          
          <div className="space-y-2">
            {(issuesBySprint[sprint._id] || []).map((task) => (
              <div
                key={task._id}
                className="p-2 border rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedIssue(task)}
              >
                <div className="text-sm font-medium">{task.title}</div>
                <div className="text-xs text-gray-500">
                  {task.key}-{task.issueNumber}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-xs text-gray-500">
            {(issuesBySprint[sprint._id] || []).length} issues
          </span>
          {sprint.status !== 'Completed' && (
            <button
              onClick={() => handleSprintStatus(sprint)}
              className={`px-3 py-1 text-sm rounded ${
                sprint.status === 'Started' 
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
              }`}
            >
              {sprint.status === 'Started' ? 'Complete Sprint' : 'Start Sprint'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    // Fetch employees for assignee dropdown
    getEmployees().then(data => {
      setEmployees(Array.isArray(data.employees) ? data.employees : []);
    });
  }, []);


  return (
    <div className="p-6">
    
      {/* Backlog Section */}
      <div className="mb-8">
        {loading ? (
          <div className="text-center py-4">Loading backlog data...</div>
        ) : (
          <div>
            
        {/* Create Sprint Block */}
        {['admin', 'reporter'].includes(user?.role) && (
          <div className="mb-6 p-4 bg-blue-50 rounded shadow">
            <button className="mb-2 bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setShowSprintForm(v => !v)}>
              {showSprintForm ? 'Cancel' : 'Create Sprint'}
            </button>
            {showSprintForm && (
              <form onSubmit={handleCreateSprint} className="flex flex-wrap gap-2 items-end mt-2">
                <input className="border px-3 py-2 rounded" placeholder="Sprint title" value={sprintTitle} onChange={e => setSprintTitle(e.target.value)} />
                <input className="border px-3 py-2 rounded" placeholder="Goal" value={sprintGoal} onChange={e => setSprintGoal(e.target.value)} />
                <select className="border px-3 py-2 rounded" value={sprintDuration} onChange={e => setSprintDuration(Number(e.target.value))}>
                  {[2,3,4].map(w => <option key={w} value={w}>{w} weeks</option>)}
                </select>
                <input className="border px-3 py-2 rounded" type="date" value={sprintStart} onChange={e => setSprintStart(e.target.value)} />
                <input className="border px-3 py-2 rounded" type="date" value={sprintEnd} onChange={e => setSprintEnd(e.target.value)} />
                <button className="bg-green-600 text-white px-4 py-2 rounded" type="submit">Create</button>
              </form>
            )}
          </div>
        )}
        {/* Sprints List */}
        <div className="space-y-6 mb-8">
          {activeSprints.map(sprint => (
            <div key={sprint._id} className="bg-white rounded shadow p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold text-lg text-blue-700">{sprint.title}</div>
                  <div className="text-sm text-gray-500">Goal: {sprint.goal || '—'} | {sprint.duration} weeks | {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2 items-center">
                  {user?.role === 'admin' && sprint.status !== 'Completed' && (
                    <>
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded"
                        onClick={() => setAddingIssueSprintId(sprint._id)}
                      >
                        +
                      </button>
                      {(sprint.status === 'Created' || sprint.status === 'Started') && (
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded"
                          onClick={() => handleSprintStatus(sprint)}
                        >
                          {sprint.status === 'Created' ? 'Start Sprint' : 'End Sprint'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              {/* Issues in Sprint */}
              <ul className="divide-y">
                {(issuesBySprint[sprint._id] || []).map(task => {
                  // Ensure task has the sprint and reporter info
                  const taskWithSprint = {
                    ...task,
                    sprint: task.sprint || { _id: sprint._id, title: sprint.title },
                    reporter: task.reporter || user
                  };
                  return (
                    <li
                      key={task._id}
                      className="py-2 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                      onClick={() => setSelectedIssue(taskWithSprint)}
                    >
                    <span className="text-xs text-gray-500 ml-4">{task.title}</span>
                    <span className="text-xs text-gray-500 ml-4">
                      Priority: {task.priority || '—'}
                    </span>
                    <span className="text-xs text-gray-500 ml-4">
                      Assignee: {
                        Array.isArray(task.assignee) && task.assignee.length > 0 
                          ? task.assignee[0]?.name || 'Unassigned'
                          : task.assignee?.name || 'Unassigned'
                      }
                    </span>
                    </li>
                  );
                })}
                {(issuesBySprint[sprint._id] || []).length === 0 && (
                  <li className="text-gray-400 py-2">No issues yet.</li>
                )}
              </ul>
              {/* Add Issue Form (below issues) */}
              {addingIssueSprintId === sprint._id && (
                <form onSubmit={e => handleAddIssueToSprint(e, sprint._id)} className="flex gap-2 mt-2">
                  <input className="border px-3 py-2 rounded" placeholder="Issue title" value={newIssueTitle} onChange={e => setNewIssueTitle(e.target.value)} />
                  <input className="border px-3 py-2 rounded" type="date" value={newIssueTimeline} onChange={e => setNewIssueTimeline(e.target.value)} />
                  <button className="bg-green-600 text-white px-4 py-2 rounded" type="submit">Add</button>
                  <button className="bg-gray-300 px-3 py-2 rounded" type="button" onClick={() => setAddingIssueSprintId(null)}>Cancel</button>
                </form>
              )}
            </div>
          ))}
        </div>
        {/* Completed Sprints Section */}
        {completedSprints.length > 0 && (
          <div className="mb-8">
            <div className="font-bold text-lg text-gray-700 mb-2">Completed Sprints</div>
            <div className="space-y-4">
              {completedSprints.map(sprint => (
                <div key={sprint._id} className="bg-gray-100 rounded shadow p-4 opacity-80">
                  <div className="font-bold text-blue-700">{sprint.title}</div>
                  <div className="text-sm text-gray-500">Goal: {sprint.goal || '—'} | {sprint.duration} weeks | {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}</div>
                  <ul className="divide-y mt-2">
                    {(issuesBySprint[sprint._id] || []).map(task => (
                      <li key={task._id} className="py-2 flex items-center justify-between cursor-pointer hover:bg-gray-100" onClick={() => {
                    // Ensure task has the sprint and reporter info for completed sprints too
                    const taskWithSprint = {
                      ...task,
                      sprint: task.sprint || { _id: sprint._id, title: sprint.title },
                      reporter: task.reporter || user
                    };
                    setSelectedIssue(taskWithSprint);
                  }}>
                        <span className="text-xs text-gray-500 ml-4">{task.title}</span>
                        <span className="text-xs text-gray-500 ml-4">Priority: {task.priority || '—'}</span>
                        <span className="text-xs text-gray-500 ml-4">
                          Assignee: {
                            Array.isArray(task.assignee) && task.assignee.length > 0 
                              ? task.assignee[0]?.name || 'Unassigned'
                              : task.assignee?.name || 'Unassigned'
                          }
                        </span>
                      </li>
                    ))}
                    {(issuesBySprint[sprint._id] || []).length === 0 && (
                      <li className="text-gray-400 py-2">No issues yet.</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

          </div>
        )}
        {/* Issue Popup */}
        {selectedIssue && (
          <IssuePopup 
            issue={selectedIssue} 
            sprints={sprints}
            onClose={() => setSelectedIssue(null)}
            onUpdate={handleTaskUpdate}
            projectId={projectId}
            user={user}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectBacklog;