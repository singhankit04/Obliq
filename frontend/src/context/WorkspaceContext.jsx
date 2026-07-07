import { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkspaces = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getWorkspaces();
      setWorkspaces(data.workspaces || []);
      
      // If we don't have an active workspace, select the first one
      if (data.workspaces && data.workspaces.length > 0) {
        // Keep selected workspace if it still exists
        const currentActive = activeWorkspace 
          ? data.workspaces.find(w => w._id === activeWorkspace._id) 
          : null;
        setActiveWorkspace(currentActive || data.workspaces[0]);
      } else {
        setActiveWorkspace(null);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!activeWorkspace || !activeWorkspace._id) {
      setProjects([]);
      return;
    }
    try {
      const data = await api.getProjects(activeWorkspace._id);
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  // Reload workspaces on user login/change
  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  // Reload projects whenever the active workspace changes
  useEffect(() => {
    fetchProjects();
  }, [activeWorkspace]);

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      activeWorkspace,
      setActiveWorkspace,
      projects,
      setProjects,
      loading,
      refreshWorkspaces: fetchWorkspaces,
      refreshProjects: fetchProjects
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
