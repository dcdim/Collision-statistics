import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Card, Grid, CircularProgress } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

const ProjectSelection = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => console.error("Ошибка при загрузке проектов:", err));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom sx={{ mb: 6, fontWeight: 'bold' }}>
        Выберите объект
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {projects.map(id => (
          <Grid item key={id} xs={12} sm={6} md={4} lg={3}>
            <Card 
              component={Link} 
              to={`/project/${id}`}
              sx={{ 
                p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center',
                textDecoration: 'none', transition: '0.3s', borderRadius: 4,
                '&:hover': { transform: 'translateY(-10px)', boxShadow: 10, bgcolor: '#f5f5f5' }
              }}
            >
              <BusinessIcon sx={{ fontSize: 100, color: '#1976d2', mb: 2 }} />
              <Typography variant="h4" color="textPrimary" sx={{ fontWeight: 'bold' }}>
                Объект {id}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProjectSelection;