import React from 'react';

function Dropdown({ entries, selected, onChange }) {
  return (
    <select value={selected || ''} onChange={e => onChange(Number(e.target.value))} style={{ marginBottom: 20, padding: 5 }}>
      {entries.map(e => (
        <option key={e.ID} value={e.ID}>{e.Name}</option>
      ))}
    </select>
  );
}

export default Dropdown;
