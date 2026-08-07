import { PresetCategory } from './chatPresets';

interface QuickActionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  categories: PresetCategory[];
  onSelect: (preset: string) => void;
}

export const QuickActionsPanel = ({ isOpen, onClose, categories, onSelect }: QuickActionsPanelProps) => {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      <div className={`
        fixed bottom-0 left-0 right-0 
        z-50
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}
      style={{
        background: '#141414',
        borderTop: '0.5px solid hsla(0,0%,100%,0.08)',
      }}
      >
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="rei-section-label" style={{ marginBottom: 0 }}>Quick Commands</span>
            <button 
              onClick={onClose}
              className="send-btn"
              style={{
                background: 'transparent',
                border: '0.5px solid hsla(0,0%,100%,0.08)',
                borderRadius: '6px',
                color: '#4a4845',
                fontSize: '11px',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              close
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
            {categories.map(category => (
              <div key={category.name}>
                <div className="rei-section-label" style={{ fontSize: '9px' }}>
                  {category.name}
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.prompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      className="rei-chip"
                      onClick={() => {
                        onSelect(prompt);
                        onClose();
                      }}
                    >
                      <span className="rei-chip-dot" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
