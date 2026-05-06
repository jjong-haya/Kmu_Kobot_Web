import { useEffect, type CSSProperties } from "react";
import { Bell, ChevronRight, X } from "lucide-react";
import type { NotificationItem } from "../api/notifications";

type NotificationToastProps = {
  item: NotificationItem;
  durationMs?: number;
  onClose: () => void;
  onOpen: (item: NotificationItem) => void;
};

const CATEGORY_LABELS: Record<NotificationItem["category"], string> = {
  member: "회원",
  contact: "연락",
  vote: "투표",
  approval: "승인",
  project: "프로젝트",
  announcement: "공지",
  system: "시스템",
};

type ToastStyle = CSSProperties & {
  "--kb-toast-duration": string;
};

export function NotificationToast({
  item,
  durationMs = 5600,
  onClose,
  onOpen,
}: NotificationToastProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [durationMs, item.id, onClose]);

  return (
    <div
      className="kb-notification-toast"
      role="status"
      aria-live="polite"
      style={{ "--kb-toast-duration": `${durationMs}ms` } as ToastStyle}
    >
      <button
        type="button"
        className="kb-notification-toast__body"
        onClick={() => onOpen(item)}
      >
        <span className="kb-notification-toast__icon" aria-hidden="true">
          <Bell className="h-4 w-4" />
        </span>
        <span className="kb-notification-toast__content">
          <span className="kb-notification-toast__meta">
            {CATEGORY_LABELS[item.category]}
          </span>
          <strong className="kb-notification-toast__title">{item.title}</strong>
          {item.body && (
            <span className="kb-notification-toast__message">{item.body}</span>
          )}
        </span>
        <ChevronRight className="kb-notification-toast__chevron h-4 w-4" />
      </button>
      <button
        type="button"
        className="kb-notification-toast__close"
        aria-label="알림 닫기"
        onClick={onClose}
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="kb-notification-toast__progress" />
    </div>
  );
}
