import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ChangesFeedback({ change, isExpanded, onToggle }) {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmitFeedback() {
    if (!rating || !feedback.trim()) return;

    setLoading(true);
    try {
      // Store feedback as a custom field on the change record
      await base44.entities.WijzigingsVoorstel.update(change.id, {
        user_feedback: feedback,
        user_feedback_rating: rating,
        user_feedback_date: new Date().toISOString()
      });

      setSubmitted(true);
      setTimeout(() => {
        setFeedback('');
        setRating(null);
        setSubmitted(false);
      }, 2000);
    } finally {
      setLoading(false);
    }
  }

  const getEntityLabel = (entityName) => {
    const labels = {
      CustomSchema: 'Trainingsschema',
      MealPlan: 'Voedingsschema',
      Recipe: 'Recept'
    };
    return labels[entityName] || entityName;
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between p-4 text-left hover:bg-secondary/30 transition-all"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {getEntityLabel(change.entity_naam)}
            </Badge>
            <Badge className="text-xs bg-primary/10 text-primary border-0">
              {change.veld_naam}
            </Badge>
          </div>
          <p className="font-medium text-foreground text-sm">{change.bron_naam}</p>
          {change.onderbouwing_nl && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{change.onderbouwing_nl}</p>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Change Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 font-medium mb-1">Vorige waarde</p>
              <p className="text-foreground">{change.huidige_waarde || '(nieuw)'}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-green-400 font-medium mb-1">Nieuwe waarde</p>
              <p className="text-foreground">{change.voorgestelde_waarde}</p>
            </div>
          </div>

          {/* Feedback Form */}
          {!change.user_feedback_date ? (
            <div className="space-y-3 bg-secondary/30 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground">Hoe bevalt deze wijziging?</p>

              {/* Rating */}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(r => (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      rating === r
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {'⭐'.repeat(r)}
                  </button>
                ))}
              </div>

              {/* Comment */}
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Deel je ervaring... (optioneel)"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none h-20"
              />

              <Button
                onClick={handleSubmitFeedback}
                disabled={!rating || !feedback.trim() || loading}
                className="w-full gap-2"
                size="sm"
              >
                {loading ? 'Verzenden...' : <><Send className="w-4 h-4" /> Feedback verzenden</>}
              </Button>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-xs text-green-400 font-medium mb-2">✓ Feedback verzonden</p>
              <p className="text-xs text-foreground">{change.user_feedback}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {'⭐'.repeat(change.user_feedback_rating)}
              </p>
            </div>
          )}

          {change.onderbouwing_nl && (
            <details className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3">
              <summary className="cursor-pointer hover:text-foreground font-medium">Wetenschappelijke onderbouwing</summary>
              <p className="mt-2 leading-relaxed">{change.onderbouwing_nl}</p>
            </details>
          )}
        </div>
      )}
    </div>
  );
}