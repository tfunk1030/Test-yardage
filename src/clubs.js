// Club management functionality
const clubForm = document.getElementById('club-form');
const clubList = document.getElementById('club-list');

// Load clubs from localStorage
let clubs = JSON.parse(localStorage.getItem('clubs') || '[]');

// Render clubs
function renderClubs() {
    clubList.innerHTML = '';
    clubs.sort((a, b) => b.distance - a.distance).forEach((club, index) => {
        const clubElement = document.createElement('div');
        clubElement.className = 'flex items-center justify-between bg-gray-700/50 p-4 rounded-lg';
        clubElement.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center">
                    <i class="fas fa-golf-ball text-green-400"></i>
                </div>
                <div>
                    <div class="text-white font-semibold">${club.type}</div>
                    <div class="text-gray-400 text-sm">${club.distance} yards</div>
                </div>
            </div>
            <button onclick="deleteClub(${index})" class="text-red-400 hover:text-red-300">
                <i class="fas fa-trash"></i>
            </button>
        `;
        clubList.appendChild(clubElement);
    });
}

// Add new club
clubForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('club-type').value;
    const distance = parseInt(document.getElementById('club-distance').value);

    if (!type || !distance) {
        alert('Please fill in all fields');
        return;
    }

    clubs.push({ type, distance });
    localStorage.setItem('clubs', JSON.stringify(clubs));
    renderClubs();
    clubForm.reset();
});

// Delete club
window.deleteClub = (index) => {
    if (confirm('Are you sure you want to delete this club?')) {
        clubs.splice(index, 1);
        localStorage.setItem('clubs', JSON.stringify(clubs));
        renderClubs();
    }
};

// Initial render
renderClubs();
