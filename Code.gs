/**
 * Intelligent Tab & Session Manager
 * Google Workspace Add-on for managing browser tabs and sessions
 */

const UI_LABEL = 'Intelligent Tab & Session Manager';
const storageKey = 'tabManager_config';
const logKey = 'tabManager_logs';

// Add-on Lifecycle Functions
function onInstall(e) {
  onOpen(e);
}

function onOpen(e) {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu(UI_LABEL)
    .addItem('Open Manager', 'showSidebar')
    .addItem('Save Session', 'saveCurrentSession')
    .addItem('View Sessions', 'viewSessions')
    .addItem('Analytics', 'showAnalytics')
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle(UI_LABEL)
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

// API Functions for Sidebar
function getSessions() {
  const props = PropertiesService.getUserProperties();
  const sessions = props.getProperty('sessions');
  return sessions ? JSON.parse(sessions) : [];
}

function saveSession(sessionData) {
  const sessions = getSessions();
  
  const newSession = {
    id: Utilities.getUuid(),
    name: sessionData.name,
    tags: sessionData.tags || [],
    tabs: sessionData.tabs || [],
    groups: sessionData.groups || [],
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    autoSaved: sessionData.autoSaved || false
  };
  
  sessions.push(newSession);
  
  const props = PropertiesService.getUserProperties();
  props.setProperty('sessions', JSON.stringify(sessions));
  
  logActivity('session_saved', { 
    sessionId: newSession.id,
    name: newSession.name,
    tabCount: newSession.tabs.length
  });
  
  return { success: true, session: newSession };
}

function updateSession(sessionId, data) {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  
  if (index !== -1) {
    sessions[index] = { ...sessions[index], ...data, lastModified: new Date().toISOString() };
    
    const props = PropertiesService.getUserProperties();
    props.setProperty('sessions', JSON.stringify(sessions));
    
    logActivity('session_updated', { sessionId: sessionId });
    
    return { success: true, session: sessions[index] };
  }
  
  return { success: false, error: 'Session not found' };
}

function deleteSession(sessionId) {
  const sessions = getSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  
  const props = PropertiesService.getUserProperties();
  props.setProperty('sessions', JSON.stringify(filtered));
  
  logActivity('session_deleted', { sessionId: sessionId });
  
  return { success: true };
}

function restoreSession(sessionId) {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (session) {
    // Update last opened time
    updateSession(sessionId, { lastOpened: new Date().toISOString() });
    
    logActivity('session_restored', { 
      sessionId: sessionId,
      name: session.name
    });
    
    return { success: true, session: session };
  }
  
  return { success: false, error: 'Session not found' };
}

function createGroup(groupName, tabs) {
  const groupId = Utilities.getUuid();
  const group = {
    id: groupId,
    name: groupName,
    tabs: tabs || [],
    createdAt: new Date().toISOString()
  };
  
  logActivity('group_created', { 
    groupId: groupId,
    name: groupName,
    tabCount: tabs.length
  });
  
  return { success: true, group: group };
}

function getUsageStats() {
  const sessions = getSessions();
  const stats = {
    totalSessions: sessions.length,
    totalTabs: sessions.reduce((sum, s) => sum + (s.tabs.length || 0), 0),
    totalGroups: sessions.reduce((sum, s) => sum + (s.groups.length || 0), 0),
    autoSavedCount: sessions.filter(s => s.autoSaved).length,
    recentSessions: sessions
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
      .slice(0, 5)
  };
  
  return stats;
}

function createTemplate(name, layout) {
  const templates = getTemplates();
  
  const newTemplate = {
    id: Utilities.getUuid(),
    name: name,
    layout: layout,
    createdAt: new Date().toISOString()
  };
  
  templates.push(newTemplate);
  
  const props = PropertiesService.getUserProperties();
  props.setProperty('templates', JSON.stringify(templates));
  
  logActivity('template_created', { 
    templateId: newTemplate.id,
    name: name
  });
  
  return { success: true, template: newTemplate };
}

function getTemplates() {
  const props = PropertiesService.getUserProperties();
  const templates = props.getProperty('templates');
  return templates ? JSON.parse(templates) : getDefaultTemplates();
}

function getDefaultTemplates() {
  return [
    {
      id: 'default-dev',
      name: 'Development Workspace',
      layout: {
        groups: [
          { name: 'Code', tabs: [] },
          { name: 'Documentation', tabs: [] },
          { name: 'Tools', tabs: [] }
        ]
      },
      createdAt: new Date().toISOString()
    },
    {
      id: 'default-research',
      name: 'Research Workspace',
      layout: {
        groups: [
          { name: 'Sources', tabs: [] },
          { name: 'Notes', tabs: [] },
          { name: 'References', tabs: [] }
        ]
      },
      createdAt: new Date().toISOString()
    }
  ];
}

function applyTemplate(templateId) {
  const templates = getTemplates();
  const template = templates.find(t => t.id === templateId);
  
  if (template) {
    // Create a new session based on template
    const sessionData = {
      name: template.name + ' (Template)',
      groups: template.layout.groups || [],
      tabs: []
    };
    
    return saveSession(sessionData);
  }
  
  return { success: false, error: 'Template not found' };
}

function saveCurrentSession() {
  showSidebar();
}

function viewSessions() {
  showSidebar();
}

function showAnalytics() {
  showSidebar();
}

// Session Manager Module
const SessionManager = {
  saveSession: function(sessionData) {
    return saveSession(sessionData);
  },

  restoreSession: function(sessionId) {
    return restoreSession(sessionId);
  },

  listSessions: function() {
    return getSessions();
  },

  deleteSession: function(sessionId) {
    return deleteSession(sessionId);
  },

  updateSession: function(sessionId, data) {
    return updateSession(sessionId, data);
  }
};

// Tab Organizer Module
const TabOrganizer = {
  createGroup: function(groupName, tabs) {
    return createGroup(groupName, tabs);
  },

  addToGroup: function(groupId, tabId) {
    // Placeholder for adding tab to group
    return { success: true };
  },

  removeFromGroup: function(groupId, tabId) {
    // Placeholder for removing tab from group
    return { success: true };
  },

  organizeByProject: function(project) {
    // Placeholder for project-based organization
    return { success: true, groups: [] };
  }
};

// Auto Save Engine Module
const AutoSaveEngine = {
  enableAutoSave: function(interval) {
    const config = getConfig();
    config.autoSaveEnabled = true;
    config.autoSaveInterval = interval || 300000; // 5 minutes default
    saveConfig(config);
    
    logActivity('autosave_enabled', { interval: config.autoSaveInterval });
    
    return { success: true };
  },

  disableAutoSave: function() {
    const config = getConfig();
    config.autoSaveEnabled = false;
    saveConfig(config);
    
    logActivity('autosave_disabled');
    
    return { success: true };
  },

  triggerAutoSave: function() {
    const config = getConfig();
    if (config.autoSaveEnabled) {
      // Save current session with auto-save flag
      const sessionData = {
        name: 'Auto-saved Session',
        tags: ['auto-save'],
        autoSaved: true
      };
      
      return saveSession(sessionData);
    }
    
    return { success: false, error: 'Auto-save not enabled' };
  },

  getAutoSaveStatus: function() {
    const config = getConfig();
    return {
      enabled: config.autoSaveEnabled || false,
      interval: config.autoSaveInterval || 0
    };
  }
};

// Analytics Tracker Module
const AnalyticsTracker = {
  trackSessionUsage: function(sessionId) {
    // Placeholder for usage tracking
    return { success: true };
  },

  getUsageStats: function() {
    return getUsageStats();
  },

  identifyFrequentTabs: function() {
    // Placeholder for identifying frequent tabs
    return [];
  },

  generateReport: function() {
    const stats = getUsageStats();
    return {
      summary: {
        totalSessions: stats.totalSessions,
        totalTabs: stats.totalTabs,
        averageTabsPerSession: stats.totalSessions > 0 ? (stats.totalTabs / stats.totalSessions).toFixed(2) : 0
      },
      sessions: stats.recentSessions,
      generatedAt: new Date().toISOString()
    };
  }
};

// Template Manager Module
const TemplateManager = {
  createTemplate: function(name, layout) {
    return createTemplate(name, layout);
  },

  applyTemplate: function(templateId) {
    return applyTemplate(templateId);
  },

  listTemplates: function() {
    return getTemplates();
  },

  deleteTemplate: function(templateId) {
    const templates = getTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    
    const props = PropertiesService.getUserProperties();
    props.setProperty('templates', JSON.stringify(filtered));
    
    return { success: true };
  }
};

// Share Manager Module
const ShareManager = {
  shareSession: function(sessionId, users) {
    // Placeholder for session sharing
    return { success: true };
  },

  getSharedSessions: function() {
    // Placeholder for getting shared sessions
    return [];
  },

  revokeAccess: function(sessionId, user) {
    // Placeholder for revoking access
    return { success: true };
  },

  getAccessList: function(sessionId) {
    // Placeholder for getting access list
    return [];
  }
};

// Helper Functions
function getConfig() {
  const props = PropertiesService.getUserProperties();
  const config = props.getProperty(storageKey);
  return config ? JSON.parse(config) : { autoSaveEnabled: false, autoSaveInterval: 300000 };
}

function saveConfig(config) {
  const props = PropertiesService.getUserProperties();
  props.setProperty(storageKey, JSON.stringify(config));
}

function logActivity(action, details) {
  const props = PropertiesService.getUserProperties();
  const logs = JSON.parse(props.getProperty(logKey) || '[]');
  logs.unshift({
    timestamp: new Date().toISOString(),
    action: action,
    details: details
  });
  if (logs.length > 100) {
    logs.pop();
  }
  props.setProperty(logKey, JSON.stringify(logs));
}

function getActivityLog() {
  const props = PropertiesService.getUserProperties();
  return JSON.parse(props.getProperty(logKey) || '[]');
}
