import Dialog from './Dialog';

/**
 * Modal alias for backward compatibility — uses shadcn Dialog under the hood.
 */
export default function Modal({ isOpen, ...props }) {
  return <Dialog open={isOpen} {...props} />;
}
