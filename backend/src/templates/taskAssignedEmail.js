import { renderEmailLayout } from './emailLayout.js';
import { renderHeader, renderGreeting, renderMetaTable, renderPrimaryButton, renderSignature } from './components.js';

/**
 * Task Assigned Email
 * @param {Object} params
 * @param {string} params.taskTitle
 * @param {string} params.taskUrl
 * @param {string} [params.assignerName]
 * @param {string} [params.projectName]
 * @param {string} [params.dueDate]
 * @param {string} [params.priority]
 * @param {string} [params.assigneeName]
 */
export const renderTaskAssignedEmail = ({ taskTitle, taskUrl, assignerName, projectName, dueDate, priority, assigneeName }) => {
  const title = 'New task assigned to you';
  const subtitle = `${assignerName || 'A teammate'} assigned a task that needs your attention.`;
  const preheader = `${assignerName || 'Someone'} assigned "${taskTitle}" to you on Obliq.`;

  const metaItems = [
    { label: 'Task', value: taskTitle },
    { label: 'Assigned By', value: assignerName || 'Teammate' },
  ];
  if (projectName) metaItems.push({ label: 'Project', value: projectName });
  if (dueDate) metaItems.push({ label: 'Due Date', value: dueDate });
  if (priority) metaItems.push({ label: 'Priority', value: priority });

  const content = `
    ${renderHeader({ title, subtitle })}
    ${renderGreeting(assigneeName)}
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #94A3B8; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
      <strong style="color: #F1F5F9;">${assignerName || 'A teammate'}</strong> has assigned a task to you.
      Click below to view the full details, add comments, and update the status.
    </p>
    ${renderMetaTable(metaItems)}
    ${renderPrimaryButton({ text: 'View Task Details', url: taskUrl })}
    ${renderSignature()}
  `;

  return renderEmailLayout({ title, preheader, content });
};
