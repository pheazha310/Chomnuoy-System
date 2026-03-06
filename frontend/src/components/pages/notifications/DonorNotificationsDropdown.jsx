function DonorNotificationsDropdown({
  notifications,
  unreadCount,
  isAllNotificationsOpen,
  onMarkAllRead,
  onToggleAll,
}) {
  const displayedNotifications = isAllNotificationsOpen ? notifications : notifications.slice(0, 3);

  return (
    <div className="donor-notification-dropdown" aria-label="Notifications panel">
      <div className="donor-notification-header">
        <h4>Notifications</h4>
        <button
          type="button"
          className="donor-mark-read"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </button>
      </div>

      <ul className="donor-notification-list">
        {displayedNotifications.map((item) => (
          <li key={item.id} className={`donor-notification-item ${item.isRead ? 'is-read' : ''}`}>
            <span className={`donor-notification-icon ${item.type}`} aria-hidden="true">
              {item.type === 'success' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" strokeWidth="2" />
                  <path d="m8 12 2.2 2.2L16 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {item.type === 'info' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 7h13l4 4v6H7l-4-4z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="8.5" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="16.5" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              )}
              {item.type === 'message' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="m12 20-1.2-1.1C6.2 14.7 3 11.8 3 8.2 3 5.3 5.2 3 8.1 3c1.7 0 3.2.8 4 2.1C12.9 3.8 14.5 3 16.1 3 19 3 21 5.3 21 8.2c0 3.6-3.2 6.5-7.8 10.7z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <div className="donor-notification-content">
              <div className="donor-notification-topline">
                <p>{item.title}</p>
                <time>{item.time}</time>
              </div>
              <span>{item.message}</span>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`donor-view-all-notifications ${isAllNotificationsOpen ? 'is-expanded' : ''}`}
        onClick={onToggleAll}
      >
        {isAllNotificationsOpen ? 'View Fewer Notifications' : 'View All Notifications'}
      </button>
    </div>
  );
}

export default DonorNotificationsDropdown;
