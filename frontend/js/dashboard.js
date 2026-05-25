/**
 * dashboard.js — Gestión del Dashboard
 *
 * Responsabilidades:
 * - Calcular KPIs (clientes, proyectos, tareas, ingresos)
 * - Actualizar gráficos y visualizaciones
 * - Renderizar datos en tarjetas
 * - Mostrar actividad reciente y proyectos próximos a vencer
 */

// ════════════════════════════════════════════════════════════
// ACTUALIZACIÓN DEL DASHBOARD
// ════════════════════════════════════════════════════════════

/**
 * Actualiza todos los datos del dashboard
 */
async function updateDashboard() {
  try {
    // Cargar datos
    const clients = await getClients() || [];
    const projects = await getProjects() || [];
    const tasks = await getTasks() || [];

    // Calcular KPIs
    const kpis = calculateKPIs(clients, projects, tasks);
    updateKPICards(kpis);

    // Actualizar gráficos
    updateProjectStatusChart(projects);
    updateTaskPriorityChart(tasks);
    updateTopClientsChart(clients, projects);
    updateActivityList(tasks, projects);
    updateUpcomingDeadlines(projects);

  } catch (err) {
    console.error('[Dashboard] Error actualizando dashboard:', err);
  }
}

// ════════════════════════════════════════════════════════════
// CÁLCULO DE KPIs
// ════════════════════════════════════════════════════════════

function calculateKPIs(clients, projects, tasks) {
  // Clientes activos
  const activeClients = clients.filter(c => c.status === 'active').length;

  // Proyectos en progreso (mantener como array para usar después)
  const activeProjectsList = projects.filter(p => p.status === 'in_progress');

  // Tareas pendientes
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  // Ingresos potenciales (suma de presupuestos/valores de proyectos activos)
  let totalRevenue = 0;
  activeProjectsList.forEach(project => {
    if (project.budget) {
      totalRevenue += parseFloat(project.budget) || 0;
    }
  });

  return {
    activeClients,
    activeProjects: activeProjectsList.length,
    pendingTasks,
    totalRevenue,
  };
}

/**
 * Actualiza las tarjetas de KPI en el DOM
 */
function updateKPICards(kpis) {
  const els = {
    activeClients: document.getElementById('kpiActiveClients'),
    activeProjects: document.getElementById('kpiActiveProjects'),
    pendingTasks: document.getElementById('kpiPendingTasks'),
    revenue: document.getElementById('kpiRevenue'),
  };

  if (els.activeClients) els.activeClients.textContent = kpis.activeClients;
  if (els.activeProjects) els.activeProjects.textContent = kpis.activeProjects;
  if (els.pendingTasks) els.pendingTasks.textContent = kpis.pendingTasks;
  if (els.revenue) els.revenue.textContent = `$${kpis.totalRevenue.toLocaleString('es-ES')}`;
}

// ════════════════════════════════════════════════════════════
// GRÁFICOS Y VISUALIZACIONES
// ════════════════════════════════════════════════════════════

/**
 * Actualiza el gráfico de estado de proyectos
 */
function updateProjectStatusChart(projects) {
  const canvas = document.getElementById('projectStatusChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const statusCounts = {
    in_progress: projects.filter(p => p.status === 'in_progress').length,
    pending: projects.filter(p => p.status === 'pending').length,
    done: projects.filter(p => p.status === 'done').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length,
  };

  drawDonutChart(ctx, canvas.width, canvas.height, statusCounts);
  updateProjectStatusLegend(statusCounts);
}

/**
 * Actualiza el gráfico de tareas por prioridad
 */
function updateTaskPriorityChart(tasks) {
  const canvas = document.getElementById('taskPriorityChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const priorityCounts = {
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length,
  };

  drawDonutChart(ctx, canvas.width, canvas.height, priorityCounts);
  updateTaskPriorityLegend(priorityCounts);
}

/**
 * Dibuja un gráfico tipo dona simple
 */
function drawDonutChart(ctx, width, height, data) {
  // Colors
  const colors = {
    in_progress: '#64a0ff',
    pending: '#f0d24d',
    done: '#64dc82',
    cancelled: '#888888',
    high: '#e85d4a',
    medium: '#f0d24d',
    low: '#64dc82',
  };

  const items = Object.entries(data);
  const total = items.reduce((sum, [_, count]) => sum + count, 0);

  if (total === 0) {
    ctx.fillStyle = '#4a5068';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sin datos', width / 2, height / 2);
    return;
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  const innerRadius = radius * 0.6;

  let angle = -Math.PI / 2;

  items.forEach(([label, count]) => {
    const sliceAngle = (count / total) * 2 * Math.PI;
    const color = colors[label] || '#c8f04d';

    // Draw slice
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
    ctx.lineTo(
      centerX + innerRadius * Math.cos(angle + sliceAngle),
      centerY + innerRadius * Math.sin(angle + sliceAngle)
    );
    ctx.arc(centerX, centerY, innerRadius, angle + sliceAngle, angle, true);
    ctx.closePath();
    ctx.fill();

    angle += sliceAngle;
  });

  // Center text
  ctx.fillStyle = '#e8ecf4';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, centerX, centerY);
}

/**
 * Actualiza la leyenda de estado de proyectos
 */
function updateProjectStatusLegend(statusCounts) {
  const legend = document.getElementById('projectStatusLegend');
  if (!legend) return;

  const labels = {
    in_progress: 'En progreso',
    pending: 'Pendiente',
    done: 'Completado',
    cancelled: 'Cancelado',
  };

  const colors = {
    in_progress: '#64a0ff',
    pending: '#f0d24d',
    done: '#64dc82',
    cancelled: '#888888',
  };

  legend.innerHTML = Object.entries(statusCounts)
    .map(([status, count]) => `
      <div class="legend-item">
        <div class="legend-color" style="background: ${colors[status]};"></div>
        <span>${labels[status]}: ${count}</span>
      </div>
    `)
    .join('');
}

/**
 * Actualiza la leyenda de tareas por prioridad
 */
function updateTaskPriorityLegend(priorityCounts) {
  const legend = document.getElementById('taskPriorityLegend');
  if (!legend) return;

  const labels = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  };

  const colors = {
    high: '#e85d4a',
    medium: '#f0d24d',
    low: '#64dc82',
  };

  legend.innerHTML = Object.entries(priorityCounts)
    .map(([priority, count]) => `
      <div class="legend-item">
        <div class="legend-color" style="background: ${colors[priority]};"></div>
        <span>${labels[priority]}: ${count}</span>
      </div>
    `)
    .join('');
}

/**
 * Actualiza el gráfico de top 5 clientes
 */
function updateTopClientsChart(clients, projects) {
  const container = document.getElementById('topClientsChart');
  if (!container) return;

  // Contar proyectos por cliente
  const clientProjectCount = {};
  clients.forEach(c => {
    const count = projects.filter(p => p.client_id === c.id).length;
    if (count > 0) {
      clientProjectCount[c.name] = count;
    }
  });

  // Top 5
  const sorted = Object.entries(clientProjectCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = '<p class="empty-hint">Sin clientes con proyectos</p>';
    return;
  }

  const max = sorted[0][1];
  container.innerHTML = sorted
    .map(([clientName, count]) => {
      const percentage = (count / max) * 100;
      return `
        <div class="chart-bar">
          <div class="chart-bar-label">${escapeHtml(clientName)}</div>
          <div class="chart-bar-fill" style="width: ${percentage}%;">
            <div class="chart-bar-value">${count}</div>
          </div>
        </div>
      `;
    })
    .join('');
}

/**
 * Actualiza la lista de actividad reciente
 */
function updateActivityList(tasks, projects) {
  const container = document.getElementById('recentActivityList');
  if (!container) return;

  // Crear eventos de actividad
  const events = [];

  // Tareas completadas recientemente
  tasks.filter(t => t.status === 'done').slice(-5).forEach(task => {
    events.push({
      type: 'task_completed',
      title: `Tarea completada: ${task.title}`,
      time: task.updated_at || new Date().toISOString(),
      priority: 'normal',
    });
  });

  // Proyectos completados
  projects.filter(p => p.status === 'done').slice(-3).forEach(project => {
    events.push({
      type: 'project_done',
      title: `Proyecto finalizado: ${project.name}`,
      time: project.updated_at || new Date().toISOString(),
      priority: 'high',
    });
  });

  // Ordenar por tiempo descendente
  events.sort((a, b) => new Date(b.time) - new Date(a.time));

  if (events.length === 0) {
    container.innerHTML = '<p class="empty-hint">Sin actividad reciente</p>';
    return;
  }

  container.innerHTML = events
    .slice(0, 5)
    .map(event => `
      <div class="activity-item">
        <strong>${escapeHtml(event.title)}</strong>
        <span class="activity-time">${formatDate(event.time)}</span>
      </div>
    `)
    .join('');
}

/**
 * Actualiza la lista de proyectos próximos a vencer
 */
function updateUpcomingDeadlines(projects) {
  const container = document.getElementById('upcomingProjects');
  if (!container) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = projects
    .filter(p => p.deadline && p.status !== 'done' && p.status !== 'cancelled')
    .map(p => ({
      ...p,
      daysUntil: Math.ceil((new Date(p.deadline) - today) / (1000 * 60 * 60 * 24)),
    }))
    .filter(p => p.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  if (upcoming.length === 0) {
    container.innerHTML = '<p class="empty-hint">Todas las fechas límite están bajo control</p>';
    return;
  }

  container.innerHTML = upcoming
    .map(project => {
      let statusClass = 'ok';
      let statusText = `${project.daysUntil} días`;

      if (project.daysUntil === 0) {
        statusClass = 'urgent';
        statusText = 'Hoy';
      } else if (project.daysUntil <= 3) {
        statusClass = 'urgent';
        statusText = `${project.daysUntil} días`;
      } else if (project.daysUntil <= 7) {
        statusClass = 'soon';
        statusText = `${project.daysUntil} días`;
      }

      return `
        <div class="deadline-item">
          <div class="deadline-icon">📅</div>
          <div class="deadline-content">
            <div class="deadline-project">${escapeHtml(project.name)}</div>
            <div class="deadline-date">${formatDate(project.deadline)}</div>
          </div>
          <div class="deadline-status ${statusClass}">${statusText}</div>
        </div>
      `;
    })
    .join('');
}

// ════════════════════════════════════════════════════════════
// UTILIDADES DE FORMATEO
// ════════════════════════════════════════════════════════════

/**
 * Formatea una fecha para mostrar
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.floor((date - today) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';

  return date.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
  });
}
