import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const GREET = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
};

export default function DagHeader({ user, profile, loading }) {
  const dagLabel = format(new Date(), 'EEEE d MMMM', { locale: nl });
  const voornaam = user?.full_name?.split(' ')[0] || '';

  return (
    <div className="mb-2">
      <p className="text-xs text-muted-foreground capitalize mb-1">{dagLabel}</p>
      <h1 className="text-2xl font-bold text-foreground">
        {GREET()}{voornaam ? `, ${voornaam}` : ''} 👋
      </h1>
      {!loading && profile?.hoofd_doel && (
        <p className="text-sm text-muted-foreground mt-1">
          Jouw doel: <span className="text-foreground font-medium capitalize">{profile.hoofd_doel.replace(/_/g, ' ')}</span>
        </p>
      )}
    </div>
  );
}