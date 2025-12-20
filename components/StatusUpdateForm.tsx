import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from './Button';

interface StatusUpdateFormProps {
    onSubmit: (content: string) => Promise<void>;
    maxLength?: number;
}

export const StatusUpdateForm: React.FC<StatusUpdateFormProps> = ({
    onSubmit,
    maxLength = 280
}) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const charactersLeft = maxLength - content.length;
    const isOverLimit = charactersLeft < 0;
    const isEmpty = content.trim().length === 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isEmpty || isOverLimit || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(content.trim());
            setContent('');
        } catch (err: any) {
            setError(err.message || 'Fehler beim Erstellen');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Was beschäftigt dich gerade?"
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
                    disabled={isSubmitting}
                />
                <div className={`absolute bottom-3 right-3 text-sm ${isOverLimit ? 'text-red-500' :
                        charactersLeft <= 20 ? 'text-yellow-500' :
                            'text-slate-500'
                    }`}>
                    {charactersLeft}
                </div>
            </div>

            {error && (
                <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={isEmpty || isOverLimit || isSubmitting}
                    className="flex items-center gap-2"
                >
                    <Send size={16} />
                    {isSubmitting ? 'Wird gepostet...' : 'Posten'}
                </Button>
            </div>
        </form>
    );
};

export default StatusUpdateForm;
