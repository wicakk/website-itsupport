import { T, inputStyle, labelStyle } from '../../theme'

export const Input = ({ label, icon: Icon, style: ext = {}, ...props }) => (
  <div>
    {label && <label style={labelStyle}>{label}</label>}
    <div style={{ position: 'relative' }}>
      {Icon && <Icon size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textDim, pointerEvents: 'none' }} />}
      <input {...props} style={{ ...inputStyle, ...(Icon ? { paddingLeft: 36 } : {}), ...ext }}
        onFocus={e => (e.target.style.borderColor = T.accent)} onBlur={e => (e.target.style.borderColor = T.border)} />
    </div>
  </div>
)

export const Textarea = ({ label, style: ext = {}, ...props }) => (
  <div>
    {label && <label style={labelStyle}>{label}</label>}
    <textarea {...props} style={{ ...inputStyle, height: 90, resize: 'none', ...ext }}
      onFocus={e => (e.target.style.borderColor = T.accent)} onBlur={e => (e.target.style.borderColor = T.border)} />
  </div>
)

export const Select = ({ label, options, ...props }) => (
  <div>
    {label && <label style={labelStyle}>{label}</label>}
    <select {...props} style={{ ...inputStyle, cursor: 'pointer' }}
      onFocus={e => (e.target.style.borderColor = T.accent)} onBlur={e => (e.target.style.borderColor = T.border)}>
      {options.map(o => <option key={o} value={o} style={{ background: T.surface }}>{o}</option>)}
    </select>
  </div>
)

export const SearchBar = ({ value, onChange, placeholder = 'Cari...', icon: Icon }) => (
  <div style={{ position: 'relative', flex: 1 }}>
    {Icon && <Icon size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textDim, pointerEvents: 'none' }} />}
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ ...inputStyle, ...(Icon ? { paddingLeft: 36 } : {}) }}
      onFocus={e => (e.target.style.borderColor = T.accent)} onBlur={e => (e.target.style.borderColor = T.border)} />
  </div>
)
