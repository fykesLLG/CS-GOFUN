const API_CASES = "https://githubusercontent.com";
const API_SKINS = "https://githubusercontent.com";

let allSkins = [];
let activeCase = null;
let balance = 1000;

// Оригинальные шансы CS2: Синее(80%), Фиолетовое(16%), Розовое(3.2%), Красное(0.64%), Нож/Золото(0.26%)
const RARITY_CHANCES = [
    { type: 'rarity_rare_weapon', chance: 80, color: '#4b69ff' },       // Синее
    { type: 'rarity_mythical_weapon', chance: 16, color: '#8847ff' },   // Фиолетовое
    { type: 'rarity_legendary_weapon', chance: 3.2, color: '#d32ce6' }, // Розовое
    { type: 'rarity_ancient_weapon', chance: 0.64, color: '#eb4b4b' },  // Красное
    { type: 'rarity_ancient', chance: 0.26, color: '#e4ae39' }          // Ножи / Перчатки
];

// 1. Загрузка реальных кейсов из API при старте
async function initGame() {
    try {
        const skinsResponse = await fetch(API_SKINS);
        allSkins = await skinsResponse.json();

        const casesResponse = await fetch(API_CASES);
        const casesData = await casesResponse.json();
        
        renderCases(casesData.slice(0, 15)); // Берем первые 15 реальных кейсов для витрины
    } catch (err) {
        document.getElementById('casesGrid').innerText = "Ошибка загрузки данных из Steam API.";
    }
}

// 2. Отрисовка кейсов на главном экране
function renderCases(cases) {
    const grid = document.getElementById('casesGrid');
    grid.innerHTML = '';
    
    cases.forEach(c => {
        const card = document.createElement('div');
        card.className = 'case-card';
        card.innerHTML = `
            <img src="${c.image}" alt="${c.name}">
            <p>${c.name}</p>
            <button>2.50$</button>
        `;
        card.onclick = () => selectCase(c);
        grid.appendChild(card);
    });
}

// 3. Выбор кейса и переход на экран рулетки
function selectCase(caseData) {
    activeCase = caseData;
    document.getElementById('currentCaseName').innerText = caseData.name;
    document.getElementById('shopScreen').classList.add('hidden');
    document.getElementById('openScreen').classList.remove('hidden');
    
    generateRouletteLine();
}

// 4. Генерация ленты оружия на основе содержимого кейса
function generateRouletteLine() {
    const line = document.getElementById('rouletteLine');
    line.innerHTML = '';
    line.style.transition = 'none';
    line.style.transform = 'translateX(0px)';

    // Фильтруем общую базу скинов: вытаскиваем только те, что привязаны к этому кейсу
    const caseSkins = allSkins.filter(skin => skin.cases && skin.cases.some(c => c.id === activeCase.id));

    // Набиваем ленту 30 случайными пушками для эффекта прокрутки
    for (let i = 0; i < 30; i++) {
        const rolledSkin = rollSkinByLuck(caseSkins);
        const item = document.createElement('div');
        item.className = 'roulette-item';
        // Окрашиваем бордер в цвет редкости
        const rarityInfo = RARITY_CHANCES.find(r => r.type === rolledSkin.rarity.id);
        item.style.borderBottom = `4px solid ${rarityInfo ? rarityInfo.color : '#fff'}`;
        
        item.innerHTML = `
            <img src="${rolledSkin.image}" alt="skin">
            <div>${rolledSkin.name.split(' | ')[0]}</div>
        `;
        line.appendChild(item);
    }
}

// 5. Алгоритм честного рандома CS2 по процентам
function rollSkinByLuck(caseSkins) {
    const rand = Math.random() * 100;
    let sum = 0;
    let targetRarity = 'rarity_rare_weapon';

    for (let r of RARITY_CHANCES) {
        sum += r.chance;
        if (rand <= sum) {
            targetRarity = r.type;
            break;
        }
    }

    // Ищем скины нужной редкости в этом кейсе
    let pool = caseSkins.filter(s => s.rarity.id === targetRarity);
    
    // Если такой редкости в кейсе нет (например, выпал нож, а в кейсе его ID прописан иначе), берем любой доступный скин
    if (pool.length === 0) pool = caseSkins; 
    
    return pool[Math.floor(Math.random() * pool.length)];
}

// 6. Запуск анимации кручения рулетки
document.getElementById('startSpinBtn').onclick = () => {
    if (balance < 2.5) return alert("Недостаточно денег!");
    balance -= 2.5;
    document.getElementById('userBalance').innerText = balance.toFixed(2);

    const line = document.getElementById('rouletteLine');
    
    // Генерируем финальный заезд
    generateRouletteLine();

    // Запускаем CSS анимацию смещения ленты влево
    setTimeout(() => {
        line.style.transition = 'transform 4s cubic-bezier(0.1, 0.6, 0.1, 1)';
        // Смещаем ленту так, чтобы 25-й элемент оказался ровно под стрелкой (центром окна)
        const itemWidth = 130;
        const wrapperWidth = document.querySelector('.roulette-wrapper').offsetWidth;
        const targetShift = (24 * itemWidth) - (wrapperWidth / 2) + (itemWidth / 2);
        
        line.style.transform = `translateX(-${targetShift}px)`;
    }, 50);

    // Через 4 секунды (когда рулетка встанет) показываем дроп
    setTimeout(() => {
        const winnerItem = line.children[24]; // 25-й элемент
        const img = winnerItem.querySelector('img').src;
        const name = winnerItem.querySelector('div').innerText;

        // Включаем вибрацию на телефоне (работает внутри APK)
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        document.getElementById('winImage').src = img;
        document.getElementById('winName').innerText = name;
        document.getElementById('winModal').classList.remove('hidden');
    }, 4100);
};

// Навигация и закрытие окон
document.getElementById('backBtn').onclick = () => {
    document.getElementById('openScreen').classList.add('hidden');
    document.getElementById('shopScreen').classList.remove('hidden');
};
document.getElementById('closeModalBtn').onclick = () => {
    document.getElementById('winModal').classList.add('hidden');
};

// Старт игры
initGame();
                                
