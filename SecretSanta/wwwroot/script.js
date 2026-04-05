document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api/santa';
    
    const joinSection = document.querySelector('.join-section');
    const userNameInput = document.getElementById('user-name');
    const registerBtn = document.getElementById('join-btn');

    const resultSection = document.getElementById('result-section');
    const wishTextarea = document.getElementById('wish-input');
    const sendWishBtn = document.getElementById('send-wish-btn');
    const statusMessage = document.getElementById('status-message');
    const greetingText = document.getElementById('greeting-text');
    const friendWishDisplay = document.getElementById('friend-wish-display');

    let currentUserName = '';
    let currentGiftFor = null;

    async function fetchFriendWish(friendName) {
        if (!friendName || !friendWishDisplay) return;
        try {
            const res = await fetch(`${API_BASE_URL}/wish/${encodeURIComponent(friendName)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.wish && data.wish.trim() !== '') {
                    friendWishDisplay.innerHTML = `<p><strong>📜 Пожелание от твоего друга:</strong><br>"${escapeHtml(data.wish)}"</p>`;
                    friendWishDisplay.style.display = 'block';
                } else {
                    friendWishDisplay.innerHTML = `<p>😞 ${escapeHtml(friendName)} ещё не оставил(а) пожелание.</p>`;
                    friendWishDisplay.style.display = 'block';
                }
            } else {
                friendWishDisplay.innerHTML = `<p>⚠️ Не удалось загрузить пожелание.</p>`;
                friendWishDisplay.style.display = 'block';
            }
        } catch (err) {
            console.error('Ошибка загрузки пожелания:', err);
        }
    }

    function escapeHtml(str) {
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    function showResultSection(userName, friendName) {
        if (joinSection) joinSection.classList.add('hidden');
        if (resultSection) {
            resultSection.classList.remove('hidden');
            if (friendName) {
                greetingText.innerHTML = `Привет, <b>${escapeHtml(userName)}</b>!<br>Твой тайный друг: <span class="friend-name">${escapeHtml(friendName)}</span><br>Не забудь оставить пожелание!`;
                currentGiftFor = friendName;
                fetchFriendWish(friendName);
            } else {
                greetingText.innerHTML = `Привет, <b>${escapeHtml(userName)}</b>!<br>Вы зарегистрированы. Подождите, пока наберётся минимум 2 участника, чтобы получить друга.`;
                currentGiftFor = null;
                if (friendWishDisplay) friendWishDisplay.style.display = 'none';
            }
        }
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const userName = userNameInput.value.trim();
            if (!userName) {
                alert('Пожалуйста, введите ваше имя!');
                return;
            }

            registerBtn.disabled = true;
            registerBtn.textContent = 'Загрузка...';

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: userName })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || 'Ошибка сети');
                }
                
                const data = await response.json();
                currentUserName = data.userName;
                showResultSection(data.userName, data.giftFor);
            } catch (error) {
                console.error('Ошибка:', error);
                alert(error.message || 'Не удалось подключиться к серверу. Попробуйте позже.');
                registerBtn.disabled = false;
                registerBtn.textContent = 'Участвовать / Получить подарок';
            } finally {
                registerBtn.disabled = false;
                registerBtn.textContent = 'Участвовать / Получить подарок';
            }
        });
    }

    if (sendWishBtn) {
        sendWishBtn.addEventListener('click', async () => {
            const wishText = wishTextarea.value.trim();
            if (!currentUserName) {
                alert('Пожалуйста, сначала зарегистрируйтесь!');
                return;
            }
            if (!wishText) {
                alert('Пожелание не может быть пустым!');
                return;
            }

            sendWishBtn.disabled = true;
            sendWishBtn.textContent = 'Отправка...';

            try {
                const response = await fetch(`${API_BASE_URL}/wish`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: currentUserName, wish: wishText })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || 'Ошибка отправки');
                }

                statusMessage.textContent = 'Пожелание отправлено! 🎉';
                statusMessage.style.color = 'green';
                wishTextarea.disabled = true;
                sendWishBtn.textContent = 'Отправлено';
                
                setTimeout(() => {
                    statusMessage.textContent = '';
                }, 3000);
            } catch (error) {
                console.error('Ошибка:', error);
                alert(error.message || 'Не удалось отправить пожелание.');
                sendWishBtn.disabled = false;
                sendWishBtn.textContent = 'Отправить пожелание';
            }
        });
    }
});