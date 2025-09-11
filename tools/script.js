let tools = [];
let currentPage = 1;
const itemsPerPage = 24;

async function loadTools() {
  const container = document.getElementById('tool-container');
  const loader = document.getElementById('loader');

  try {
    const response = await fetch('tools.json');
    tools = await response.json();
    displayTools();
  } catch (error) {
    console.error('Error loading tools:', error);
    container.innerHTML = `<p class="text-danger text-center">Failed to load tools. Please try again later.</p>`;
  } finally {
    loader.classList.add('d-none');
    container.classList.remove('d-none');
  }
}

function displayTools(filteredTools = tools) {
  const container = document.getElementById('tool-container');
  const pagination = document.getElementById('pagination');
  container.innerHTML = '';

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTools = filteredTools.slice(startIndex, endIndex);

  if (paginatedTools.length === 0) {
    container.innerHTML = `<p class="text-center">No tools found.</p>`;
    pagination.innerHTML = '';
    return;
  }

  paginatedTools.forEach(tool => {
    const card = document.createElement('div');
    card.className = 'col-md-4';
    card.innerHTML = `
      <div class="card h-100 shadow-sm">
        <img src="${tool.image}" class="card-img-top" alt="${tool.name}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${tool.name}</h5>
          <p class="card-text flex-grow-1">${tool.title}</p>
          <div class="mb-2">
            ${tool.tags.map(tag => `<span class="badge">${tag}</span>`).join('')}
          </div>
          <a href="${tool.url}" class="btn btn-outline-warning mt-auto" target="_blank">
            <i class="fa-solid fa-arrow-up-right-from-square me-2"></i>View Tool
          </a>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  renderPagination(filteredTools);
}

function renderPagination(filteredTools) {
  const pagination = document.getElementById('pagination');
  const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
  pagination.innerHTML = '';

  if (totalPages <= 1) return;

  const visiblePages = 5; // Maximum number of pages to display at once
  const startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
  const endPage = Math.min(totalPages, startPage + visiblePages - 1);

  // First and Previous buttons
  if (currentPage > 1) {
    pagination.innerHTML += `
      <li class="page-item">
        <a href="#" class="page-link" data-page="1">&laquo;</a>
      </li>
      <li class="page-item">
        <a href="#" class="page-link" data-page="${currentPage - 1}">&lsaquo;</a>
      </li>
    `;
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a href="#" class="page-link" data-page="${i}">${i}</a>
      </li>
    `;
  }

  // Next and Last buttons
  if (currentPage < totalPages) {
    pagination.innerHTML += `
      <li class="page-item">
        <a href="#" class="page-link" data-page="${currentPage + 1}">&rsaquo;</a>
      </li>
      <li class="page-item">
        <a href="#" class="page-link" data-page="${totalPages}">&raquo;</a>
      </li>
    `;
  }

  // Add event listeners to pagination links
  const links = pagination.querySelectorAll('.page-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent default anchor behavior
      const page = parseInt(link.getAttribute('data-page'));
      changePage(page, filteredTools);

      // Scroll back to the top of the container smoothly
      document.getElementById('tool-container').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function changePage(page, filteredTools) {
  currentPage = page;
  displayTools(filteredTools);
}

function handleSearch() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchInput) ||
    tool.title.toLowerCase().includes(searchInput) ||
    tool.tags.some(tag => tag.toLowerCase().includes(searchInput))
  );
  currentPage = 1;
  displayTools(filteredTools);
}

// Load tools on page load
document.addEventListener('DOMContentLoaded', loadTools);
