import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Основные страницы
import ProjectSelection from './components/ProjectSelection';
import ProjectDashboard from './components/ProjectDashboard';

// Страницы детализации (убедитесь, что пути к файлам верны)
import DetailsPageARAR from './components/DetailsPageARAR';
import DetailsPageARKR from './components/DetailsPageARKR';
import DetailsPageARTH from './components/DetailsPageARTH';
import DetailsPageKRKR from './components/DetailsPageKRKR';
import DetailsPageKRTH from './components/DetailsPageKRTH';
import DetailsPageTHTH from './components/DetailsPageTHTH';
import DetailsPageAREN from './components/DetailsPageAREN';
import DetailsPageKREN from './components/DetailsPageKREN';
import DetailsPageTHEN from './components/DetailsPageTHEN';
import DetailsPageENEN from './components/DetailsPageENEN';
import DetailsPageENDUBLE from './components/DetailsPageENDUBLE';
// Добавьте остальные, если они есть (например, ARDUBLE, KRDUBLE)

function App() {
  return (
    <Routes>
      {/* 1. Главная страница выбора объекта */}
      <Route path="/" element={<ProjectSelection />} />

      {/* 2. Дашборд конкретного объекта */}
      <Route path="/project/:projectId" element={<ProjectDashboard />} />

      {/* 3. Маршруты детализации внутри конкретного объекта */}
      {/* Параметр :projectId позволяет странице "подхватить" нужную базу данных */}
      <Route path="/project/:projectId/details/arar" element={<DetailsPageARAR />} />
      <Route path="/project/:projectId/details/arkr" element={<DetailsPageARKR />} />
      <Route path="/project/:projectId/details/arth" element={<DetailsPageARTH />} />
      <Route path="/project/:projectId/details/krkr" element={<DetailsPageKRKR />} />
      <Route path="/project/:projectId/details/krth" element={<DetailsPageKRTH />} />
      <Route path="/project/:projectId/details/thth" element={<DetailsPageTHTH />} />
      <Route path="/project/:projectId/details/aren" element={<DetailsPageAREN />} />
      <Route path="/project/:projectId/details/kren" element={<DetailsPageKREN />} />
      <Route path="/project/:projectId/details/then" element={<DetailsPageTHEN />} />
      <Route path="/project/:projectId/details/enen" element={<DetailsPageENEN />} />
      <Route path="/project/:projectId/details/enduble" element={<DetailsPageENDUBLE />} />

      {/* Редирект со старых путей (если кто-то сохранил закладки) или на главную */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;