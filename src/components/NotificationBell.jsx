import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const typeColors = {
  training_update: 'bg-red-500/10 text-red-600 border-red-200',
  nutrition_update: 'bg-orange-500/10 text-orange-600 border-orange-200',
  recipe_update: 'bg-green-500/10 text-green-600 border-green-200',
  general: 'bg-blue-500/10 text-blue-600 border-blue-200'
};

const typeLabels = {
  training_update: 'Training',
  nutrition_update: 'Voeding',
  recipe_update: 'Recept',
  general: 'Update'
};

export default function NotificationBell() {
  const [notificaties, setNotificaties] = useState([]);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
    loadNotificaties();
    const interval = setInterval(loadNotificaties, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotificaties() {
    if (!user) return;
    const notifs = await base44.entities.Notification.filter(
      { created_by: user.email, read: false },
      '-created_date',
      10
    );
    setNotificaties(notifs);
  }

  async function markAsRead(notifId) {
    await base44.entities.Notification.update(notifId, { read: true });
    setNotificaties(prev => prev.filter(n => n.id !== notifId));
  }

  async function deleteNotif(notifId) {
    await base44.entities.Notification.delete(notifId);
    setNotificaties(prev => prev.filter(n => n.id !== notifId));
  }

  if (!user) return null;

  const unreadCount = notificaties.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-all"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">
              Meldingen {unreadCount > 0 && `(${unreadCount})`}
            </h3>
          </div>

          {notificaties.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Geen nieuwe meldingen
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notificaties.map(notif => (
                <div key={notif.id} className={`p-4 border-l-4 ${typeColors[notif.type]}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-current/20">
                          {typeLabels[notif.type]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notif.created_date), 'd MMM, HH:mm', { locale: nl })}
                        </span>
                      </div>
                      <p className="font-semibold text-sm mb-1">{notif.title}</p>
                      <p className="text-sm text-foreground leading-relaxed">{notif.message}</p>
                      {notif.link && (
                        <a href={notif.link} className="text-xs text-primary hover:underline mt-2 inline-block">
                          Bekijk →
                        </a>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-1 hover:bg-secondary rounded transition-all"
                        title="Markeer als gelezen"
                      >
                        <Check className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteNotif(notif.id)}
                        className="p-1 hover:bg-secondary rounded transition-all"
                        title="Verwijder"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}