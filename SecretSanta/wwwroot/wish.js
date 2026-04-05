document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api/santa';
    const friendNameInput = document.getElementById('friend-name');
    const getWishBtn = document.getElementById('get-wish-btn');
    const wishResultDiv = document.getElementById('wish-result');

    getWishBtn.addEventListener('click', async () => {
        const name = friendNameInput.value.trim();
        if (!name) {
            alert('Введите имя друга');
            return;
        }

        getWishBtn.disabled = true;
        getWishBtn.textContent = 'Поиск...';

        try {
            const response = await fetch(`${API_BASE_URL}/wish/${encodeURIComponent(name)}`);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Пользователь не найден');
            }
            const data = await response.json();
            wishResultDiv.style.display = 'block';
            if (data.wish && data.wish !== '') {
                wishResultDiv.innerHTML = `<p>🎁 Пожелание <strong>${escapeHtml(data.name)}</strong>:<br>«${escapeHtml(data.wish)}»</p>`;
            } else {
                wishResultDiv.innerHTML = `<p>😞 ${escapeHtml(data.name)} ещё не оставил(а) пожелание. Загляните позже!</p>`;
            }
        } catch (error) {
            alert(error.message);
            wishResultDiv.style.display = 'none';
        } finally {
            getWishBtn.disabled = false;
            getWishBtn.textContent = 'Узнать пожелание';
        }
    });

    function escapeHtml(str) {
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
});