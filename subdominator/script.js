let data = []; // Will hold data from index.json
let sortOrder = {
    column: '',
    direction: 'asc' // ascending by default
};
let currentPage = 1;
const resultsPerPage = 20; // Number of results to show per page

// Fetch the JSON data and initialize the table
fetch('index.json')
    .then(response => response.json())
    .then(jsonData => {
        data = jsonData; // Save the fetched data to the `data` variable
        populateTable(data); // Populate the table with fetched data
        renderPagination(); // Render pagination controls
    })
    .catch(error => console.error('Error fetching JSON data:', error));

// Fetch and display stats near search bar
fetch('stats.json')
  .then(response => response.json())
  .then(statsData => {
    const domain = statsData.find(s => s.type === 'domain');
    const tld = statsData.find(s => s.type === 'tld');

    // Domain
    document.getElementById('domain-files-count').textContent = domain.files.toLocaleString();
    document.getElementById('domain-total-subdomains').textContent = domain.total.toLocaleString();
    document.getElementById('domain-new-subdomains').textContent = domain.new.toLocaleString();
    document.getElementById('domain-total-size').textContent = domain.size;
    document.getElementById('domain-last-updated').textContent = timeAgo(domain.last_updated);

    // TLD
    document.getElementById('tld-files-count').textContent = tld.files.toLocaleString();
    document.getElementById('tld-total-subdomains').textContent = tld.total.toLocaleString();
    document.getElementById('tld-new-subdomains').textContent = tld.new.toLocaleString();
    document.getElementById('tld-total-size').textContent = tld.size;
    document.getElementById('tld-last-updated').textContent = timeAgo(tld.last_updated);
  })
  .catch(error => console.error('Error fetching stats data:', error));

// Convert timestamp to relative string
function timeAgo(dateStr) {
  const now = new Date();
  const updated = new Date(dateStr);
  const diffMs = now - updated;
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  return `${mins} min ago`;
}

// Carousel controls
let currentSlideIndex = 0;
const slides = document.querySelectorAll(".carousel-slide");

const carouselWrapper = document.getElementById("carousel-wrapper");
let autoSlideInterval;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });
}

function nextSlide() {
  currentSlideIndex = (currentSlideIndex + 1) % slides.length;
  showSlide(currentSlideIndex);
}

function prevSlide() {
  currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
  showSlide(currentSlideIndex);
}

// Start autoplay
function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 2000);
  }
  
  // Stop autoplay
  function stopAutoSlide() {
    clearInterval(autoSlideInterval);
  }
  
  // Pause on hover
  carouselWrapper.addEventListener("mouseenter", stopAutoSlide);
  carouselWrapper.addEventListener("mouseleave", startAutoSlide);
  
  // Kick off the slideshow
  startAutoSlide();

function animateStatValue(element, newValue) {
    const current = parseInt(element.textContent.replace(/,/g, ''));
    const increment = Math.ceil(newValue / 20); // Adjust the speed of animation

    let count = current;
    const interval = setInterval(() => {
        count += increment;
        if (count >= newValue) {
            count = newValue;
            clearInterval(interval);
        }
        element.textContent = count.toLocaleString();
    }, 50); // Adjust the interval duration for speed
}

// Call this function inside your fetch success for stats
animateStatValue(document.getElementById('files-count'), statsData.files);
animateStatValue(document.getElementById('files-type'), statsData.type);
animateStatValue(document.getElementById('total-subdomains'), statsData.total);
animateStatValue(document.getElementById('new-subdomains'), statsData.new);
animateStatValue(document.getElementById('total-size'), statsData.new);

// Function to populate table with paginated data
function populateTable(filteredData = data) {
    const tableBody = document.querySelector('#platforms-table tbody');
    tableBody.innerHTML = ''; // Clear table body

    // Calculate starting and ending index for the current page
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = Math.min(startIndex + resultsPerPage, filteredData.length);

    // Display only the current page data
    const currentPageData = filteredData.slice(startIndex, endIndex);

    currentPageData.forEach(platform => {
        const row = document.createElement('tr');

        // Company Name
        const nameCell = document.createElement('td');
        nameCell.textContent = platform.name;
        row.appendChild(nameCell);

        // Company Type
        const typeCell = document.createElement('td');
        typeCell.textContent = platform.type;
        row.appendChild(typeCell);

        // Subdomains Count
        const countCell = document.createElement('td');
        countCell.textContent = platform.count.toLocaleString();
        row.appendChild(countCell);

        // New Subdomains
        const newCell = document.createElement('td');
        newCell.textContent = platform.new.toLocaleString();
        row.appendChild(newCell);

        // Company Size
        const sizeCell = document.createElement('td');
        sizeCell.textContent = platform.size;
        row.appendChild(sizeCell);

        // Company Last Updated
        const last_updatedCell = document.createElement('td');
        last_updatedCell.textContent = platform.last_updated;
        row.appendChild(last_updatedCell);

        // Download Button
        const downloadCell = document.createElement('td');
        const downloadButton = document.createElement('a');
        downloadButton.className = 'download-button';
        downloadButton.innerHTML = '<i class="fas fa-download"></i> Download';  // Add icon before the text
        downloadButton.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent the default anchor click behavior
            downloadFile(platform.url, platform.name); // Call the download function
        });
        downloadCell.appendChild(downloadButton);

        // Copy Button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy'; // Add icon before the text
        copyButton.addEventListener('click', function() {
            copyToClipboard(platform.url); // Call the copy function
        });
        downloadCell.appendChild(copyButton);

        row.appendChild(downloadCell);
        tableBody.appendChild(row);
    });
}

// Function to render pagination controls
function renderPagination() {
    const pagination = document.querySelector('#pagination');
    pagination.innerHTML = ''; // Clear pagination controls

    const totalPages = Math.ceil(data.length / resultsPerPage);

    // Create First (<<) and Previous (<) buttons
    const firstPageButton = createPaginationButton('<<', 1);
    const prevPageButton = createPaginationButton('<', Math.max(1, currentPage - 1));

    pagination.appendChild(firstPageButton);
    pagination.appendChild(prevPageButton);

    // Add page numbers (show 5 pages at a time)
    const maxVisiblePages = 5; // Number of pages to show in pagination
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're at the end of the page list
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = createPaginationButton(i, i);
        if (i === currentPage) {
            pageButton.classList.add('active'); // Highlight current page
        }
        pagination.appendChild(pageButton);
    }

    // Create Next (>) and Last (>>) buttons
    const nextPageButton = createPaginationButton('>', Math.min(totalPages, currentPage + 1));
    const lastPageButton = createPaginationButton('>>', totalPages);

    pagination.appendChild(nextPageButton);
    pagination.appendChild(lastPageButton);
}

// Helper function to create pagination button
function createPaginationButton(text, pageNumber) {
    const button = document.createElement('button');
    
    // Add icons for first, previous, next, and last buttons
    if (text === '<<') {
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-double-left" viewBox="0 0 16 16"> <path fill-rule="evenodd" d="M8.354 1.354a.5.5 0 0 0-.708-.708l-6 6a.5.5 0 0 0 0 .708l6 6a.5.5 0 0 0 .708-.708L2.707 8l5.647-5.646z"/> <path fill-rule="evenodd" d="M12.354 1.354a.5.5 0 0 0-.708-.708l-6 6a.5.5 0 0 0 0 .708l6 6a.5.5 0 0 0 .708-.708L6.707 8l5.647-5.646z"/> </svg>';
    } else if (text === '<') {
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16"> <path fill-rule="evenodd" d="M11.354 1.354a.5.5 0 0 0-.708-.708l-6 6a.5.5 0 0 0 0 .708l6 6a.5.5 0 0 0 .708-.708L5.707 8l5.647-5.646z"/> </svg>';
    } else if (text === '>') {
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16"> <path fill-rule="evenodd" d="M4.646 1.354a.5.5 0 0 1 .708-.708l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354z"/> </svg>';
    } else if (text === '>>') {
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-double-right" viewBox="0 0 16 16"> <path fill-rule="evenodd" d="M3.646 1.354a.5.5 0 0 1 .708-.708l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L9.293 8 3.646 2.354z"/> <path fill-rule="evenodd" d="M7.646 1.354a.5.5 0 0 1 .708-.708l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L13.293 8 7.646 2.354z"/> </svg>';
    } else {
        button.textContent = text; // For page number buttons, just show the number
    }

    button.classList.add('pagination-button');
    if (pageNumber === currentPage) {
        button.classList.add('active'); // Highlight current page
    }
    button.addEventListener('click', () => {
        if (currentPage !== pageNumber) { // Prevent clicking the current page button again
            currentPage = pageNumber;
            populateTable(data); // Re-populate the table
            renderPagination(); // Re-render pagination
        }
    });
    return button;
}

// Function to copy URL to clipboard
function copyToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
        // Show success notification
        const notification = document.getElementById("copy-notification");
        notification.style.display = "block"; // Show the notification
        setTimeout(() => {
            notification.style.display = "none"; // Hide after 2 seconds
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Function to search and filter the company names
function searchCompany() {
    const searchTerm = document.querySelector('#search-bar').value.toLowerCase();
    const filteredData = data.filter(platform =>
        platform.name.toLowerCase().includes(searchTerm)
    );
    currentPage = 1; // Reset to the first page after search
    populateTable(filteredData);
    renderPagination();
}

// Sorting function
function sortTable(column) {
    let sortedData;
  
    if (sortOrder.column === column) {
      sortOrder.direction = sortOrder.direction === 'asc' ? 'desc' : 'asc';
    } else {
      sortOrder.column = column;
      sortOrder.direction = 'asc';
    }
  
    if (column === 'size') {
      sortedData = [...data].sort((a, b) => {
        const aSize = convertToBytes(a.size);
        const bSize = convertToBytes(b.size);
        return sortOrder.direction === 'asc' ? aSize - bSize : bSize - aSize;
      });
    } else {
      sortedData = [...data].sort((a, b) => {
        return sortOrder.direction === 'asc'
          ? (a[column] > b[column] ? 1 : -1)
          : (a[column] < b[column] ? 1 : -1);
      });
    }
  
    // Update sorting icons
    document.querySelectorAll('th').forEach(th => th.classList.remove('sorting-asc', 'sorting-desc'));
    const th = document.querySelector(`th[onclick="sortTable('${column}')"]`);
    if (th) {
      th.classList.add(sortOrder.direction === 'asc' ? 'sorting-asc' : 'sorting-desc');
    }
  
    currentPage = 1;
    populateTable(sortedData);
    renderPagination();
}

function convertToBytes(sizeStr) {
    const units = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
    const match = sizeStr.trim().match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
    if (!match) return 0;
    const [, value, unit] = match;
    return parseFloat(value) * units[unit.toUpperCase()];
}
  

// Download function
function downloadFile(url, platformName) {
    // Ensure the filename ends with .txt
    const filename = `${platformName}.txt`; // Append .txt extension

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.blob(); // Get the file as a Blob
        })
        .then(blob => {
            const a = document.createElement('a');
            const objectUrl = url.createObjectURL(blob); // Create a URL for the Blob
            a.href = objectUrl;
            a.download = filename; // Set the filename for download

            // Append to the body (required for Firefox)
            document.body.appendChild(a);
            a.click(); // Trigger the download
            a.remove(); // Remove the anchor from the document

            // Revoke the object URL after the download
            url.revokeObjectURL(objectUrl);

            // Show the download notification
            const notification = document.getElementById("download-notification");
            notification.style.display = "block"; // Show the notification
            setTimeout(() => {
                notification.style.display = "none"; // Hide after 3 seconds
            }, 3000);
        })
        .catch(error => console.error('Error downloading file:', error));
}

// Update copyright year
const year = new Date().getFullYear();
document.getElementById("copyright").textContent = `© ${year} Bug Bounty Data - Bhagirath Saxena`;
