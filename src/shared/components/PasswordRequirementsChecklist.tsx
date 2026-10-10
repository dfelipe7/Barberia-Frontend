import React from 'react';

interface PasswordRequirementsChecklistProps {
  password?: string;
  isVisible?: boolean;
}

export const PasswordRequirementsChecklist: React.FC<PasswordRequirementsChecklistProps> = ({
  password = '',
  isVisible = true,
}) => {
  if (!isVisible) return null;

  const rules = [
    { label: 'Al menos 8 caracteres', pass: password.length >= 8 },
    { label: 'Una letra mayúscula (A-Z)', pass: /[A-Z]/.test(password) },
    { label: 'Una letra minúscula (a-z)', pass: /[a-z]/.test(password) },
    { label: 'Un número (0-9)', pass: /[0-9]/.test(password) },
    { label: 'Un símbolo (@, #, $, %, etc.)', pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const passedCount = rules.filter((r) => r.pass).length;
  const progressPercent = (passedCount / rules.length) * 100;
  const allPassed = passedCount === rules.length;

  return (
    <div
      className="position-absolute start-0 end-0 mt-1 p-3 bg-white rounded-3 border shadow-lg"
      style={{
        zIndex: 1050,
        top: '100%',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
        animation: 'fadeIn 0.2s ease-in-out',
      }}
    >
      {/* Flecha indicadora superior */}
      <div
        style={{
          position: 'absolute',
          top: '-6px',
          left: '24px',
          width: '10px',
          height: '10px',
          background: '#fff',
          borderLeft: '1px solid #dee2e6',
          borderTop: '1px solid #dee2e6',
          transform: 'rotate(45deg)',
        }}
      />

      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="fw-semibold text-dark" style={{ fontSize: '0.8rem' }}>
          Seguridad de la contraseña
        </span>
        <span
          className={`badge ${
            allPassed
              ? 'bg-success'
              : passedCount >= 3
              ? 'bg-warning text-dark'
              : 'bg-secondary'
          }`}
          style={{ fontSize: '0.7rem' }}
        >
          {allPassed ? '¡Fuerte!' : `${passedCount}/${rules.length} completados`}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="progress mb-2.5" style={{ height: '4px' }}>
        <div
          className={`progress-bar transition-all ${
            allPassed ? 'bg-success' : passedCount >= 3 ? 'bg-warning' : 'bg-danger'
          }`}
          role="progressbar"
          style={{ width: `${progressPercent}%`, transition: 'width 0.3s ease' }}
        />
      </div>

      {/* Lista de requisitos */}
      <div className="d-flex flex-column gap-1">
        {rules.map((rule, idx) => (
          <div
            key={idx}
            className={`d-flex align-items-center gap-2 ${
              rule.pass ? 'text-success fw-semibold' : 'text-muted'
            }`}
            style={{ fontSize: '0.78rem' }}
          >
            <span
              className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                rule.pass ? 'bg-success-subtle text-success' : 'bg-light text-muted'
              }`}
              style={{ width: '16px', height: '16px', fontSize: '0.65rem' }}
            >
              {rule.pass ? '✓' : '•'}
            </span>
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
