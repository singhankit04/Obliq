/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getWorkspaces();
      setWorkspaces(data.workspaces || []);
      if (data.workspaces && data.workspaces.length > 0) {
        setActiveWorkspace((prev) => {
          const currentActive = prev 
            ? data.workspaces.find((w) => w._id === prev._id) 
            : null;
          return currentActive || data.workspaces[0];
        });
      } else {
        setActiveWorkspace(null);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  }, [user]);

  const fetchProjects = useCallback(async () => {
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
  }, [activeWorkspace]);

  // Reload workspaces on user login/change
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) setLoading(true);
    });
    api.getWorkspaces()
      .then((data) => {
        if (!isMounted) return;
        setWorkspaces(data.workspaces || []);
        if (data.workspaces && data.workspaces.length > 0) {
          setActiveWorkspace((prev) => {
            const currentActive = prev 
              ? data.workspaces.find((w) => w._id === prev._id) 
              : null;
            return currentActive || data.workspaces[0];
          });
        } else {
          setActiveWorkspace(null);
        }
      })
      .catch((err) => console.error('Failed to load workspaces:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [user]);

  // Reload projects whenever the active workspace changes
  useEffect(() => {
    if (!activeWorkspace || !activeWorkspace._id) {
      return;
    }
    let isMounted = true;
    api.getProjects(activeWorkspace._id)
      .then((data) => {
        if (isMounted) setProjects(data.projects || []);
      })
      .catch((err) => console.error('Failed to load projects:', err));
    return () => { isMounted = false; };
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
