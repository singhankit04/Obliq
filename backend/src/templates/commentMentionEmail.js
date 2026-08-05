import { renderEmailLayout } from './emailLayout.js';
import { renderHeader, renderGreeting, renderQuoteBlock, renderPrimaryButton, renderSignature } from './components.js';

/**
 * Comment Mention Email
 * @param {Object} params
 * @param {string} params.authorName
 * @param {string} params.commentSnippet
 * @param {string} params.itemTitle
 * @param {string} params.itemUrl
 * @param {string} [params.recipientName]
 * @param {string} [params.projectName]
 */
export const renderCommentMentionEmail = ({ authorName, commentSnippet, itemTitle, itemUrl, recipientName, projectName }) => {
  const title = `${authorName || 'Someone'} mentioned you`;
  const subtitle = `You were mentioned in a comment on "${itemTitle || 'a task'}".`;
  const preheader = `${authorName} mentioned you: "${commentSnippet}"`;

  const content = `
    ${renderHeader({ title, subtitle })}
    ${renderGreeting(recipientName)}
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #94A3B8; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
      <strong style="color: #F1F5F9;">${authorName || 'A teammate'}</strong> mentioned you in a comment on
      <strong style="color: #F1F5F9;">${itemTitle}${projectName ? ` · ${projectName}` : ''}</strong>:
    </p>
    ${renderQuoteBlock(commentSnippet, authorName)}
    ${renderPrimaryButton({ text: 'Reply to Comment', url: itemUrl })}
    ${renderSignature()}
  `;

  return renderEmailLayout({ title, preheader, content });
};
