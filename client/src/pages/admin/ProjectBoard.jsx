import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSprints, getTasks } from '../../services/api';

const STATUS_COLUMNS = [
  { key: 'Todo', label: 'TO DO' },
  { key: 'In Progress', label: 'IN PROGRESS' },
  { key: 'Done', label: 'DONE' },
];

const ProjectBoard = () => {
  const { id: projectId } = useParams();
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [sprintsData, tasksData] = await Promise.all([
        getSprints(projectId),
        getTasks(projectId),
      ]);
      setSprints(sprintsData);
      setTasks(tasksData);
      setLoading(false);
    };
    fetchData();
  }, [projectId]);

  // Find the active sprint
  const activeSprint = sprints.find(s => s.status === 'Started');
  let sprintIssues = [];
  let daysLeft = null;
  if (activeSprint) {
    sprintIssues = tasks.filter(task => String(task.sprint) === String(activeSprint._id));
    const end = new Date(activeSprint.endDate);
    const now = new Date();
    daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  // Group issues by status
  const issuesByStatus = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.key] = sprintIssues.filter(task => task.status === col.key);
    return acc;
  }, {});

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-4 min-h-[400px]">
      <h3 className="text-2xl font-bold mb-4">Board</h3>
      {loading ? (
        <div>Loading...</div>
      ) : activeSprint ? (
        <div className="mb-4 flex items-center gap-4">
          <span className="font-semibold text-blue-700 text-lg">{activeSprint.title}</span>
          <span className="text-gray-500">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
        </div>
      ) : (
        <div className="mb-4 text-gray-400 italic">No active sprint. Start a sprint to use the board.</div>
      )}
      <div className="flex space-x-6">
        {STATUS_COLUMNS.map(col => (
          <div key={col.key} className="bg-gray-100 rounded-lg p-4 w-64 min-h-[300px]">
            <div className="font-semibold mb-2">{col.label}</div>
            {activeSprint && issuesByStatus[col.key].length === 0 && (
              <div className="text-gray-400 italic">No issues</div>
            )}
            {activeSprint && issuesByStatus[col.key].map(task => (
              <div key={task._id} className="bg-white rounded shadow p-2 mb-2 cursor-pointer">
                <div className="font-bold text-sm text-blue-700">{task.title}</div>
                <div className="text-xs text-gray-500">Assignee: {task.assignee?.name || 'Unassigned'}</div>
                <div className="text-xs text-gray-500">Priority: {task.priority || '—'}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectBoard; 