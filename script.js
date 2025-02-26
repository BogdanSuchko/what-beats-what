const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Функции для работы с куки
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Инициализация переменных
let maxScore = parseInt(getCookie('maxScore')) || 0;
let currentObject = 'камень';
let score = 0;
let history = [{text: 'камень', emoji: '🪨'}];
let usedAnswers = ['камень'];

document.getElementById('userInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && this.style.display !== 'none') {
        event.preventDefault();
        checkAnswer();
    }
});

document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const nextButton = document.getElementById('nextButton');
        if (nextButton.style.display === 'block') {
            event.preventDefault();
            nextQuestion();
        }
    }
});

// Добавляем обработчик Enter для начала новой игры
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const gameEndControls = document.getElementById('gameEndControls');
        if (gameEndControls.style.display === 'flex') {
            event.preventDefault();
            playAgain();
        }
    }
});

// В начале файла добавим функции для сохранения состояния
function saveGameState() {
    const gameState = {
        currentObject,
        score,
        maxScore,
        history,
        usedAnswers,
        lastWinner: history[0] || 'камень' // Сохраняем последний победивший объект
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadGameState() {
    try {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            
            // Конвертируем старый формат истории в новый, если нужно
            if (Array.isArray(gameState.history)) {
                gameState.history = gameState.history.map(item => {
                    if (typeof item === 'string') {
                        return { text: item, emoji: '' };
                    }
                    return item;
                });
            }
            
            // Проверяем что все необходимые поля существуют
            if (gameState && 
                typeof gameState.currentObject === 'string' && 
                typeof gameState.score === 'number' && 
                Array.isArray(gameState.history) && 
                Array.isArray(gameState.usedAnswers)) {
                
                currentObject = gameState.lastWinner || gameState.currentObject; // Используем последний победивший объект
                score = gameState.score;
                maxScore = gameState.maxScore || 0;
                history = gameState.history;
                usedAnswers = gameState.usedAnswers;
                
                // Обновляем UI
                document.getElementById('score').textContent = `счёт: ${score} | рекорд: ${maxScore}`;
                
                // Если есть история, значит игра в процессе
                if (history.length > 0) {
                    // Показываем вопрос с последним победителем
                    const questionText = document.getElementById('questionText');
                    questionText.textContent = `что побеждает ${toAccusativeCase(currentObject)}?`;
                    questionText.style.display = 'block';
                    
                    // Показываем поле ввода и кнопку отправки
                    const userInput = document.getElementById('userInput');
                    const submitButton = document.getElementById('submitButton');
                    userInput.style.display = 'block';
                    userInput.value = '';
                    submitButton.style.display = 'block';
                    
                    // Скрываем кнопки управления игрой
                    document.getElementById('gameEndControls').style.display = 'none';
                    document.getElementById('nextButton').style.display = 'none';
                    
                    // Очищаем поля битвы и объяснения
                    document.getElementById('battleText').textContent = '';
                    document.getElementById('explanation').textContent = '';
                } else {
                    // Если истории нет, показываем начальный вопрос
                    document.getElementById('questionText').textContent = 'что побеждает камень?';
                }
                
                // Обновляем отображение истории
                updateHistory();
            } else {
                // Если данные некорректны, сбрасываем состояние
                resetGameState();
            }
        }
    } catch (error) {
        console.error('Ошибка при загрузке состояния игры:', error);
        // При ошибке сбрасываем состояние
        resetGameState();
    }
}

// Добавляем функцию сброса состояния
function resetGameState() {
    currentObject = 'камень';
    score = 0;
    maxScore = 0;
    history = [{text: 'камень', emoji: '🪨'}];
    usedAnswers = ['камень'];
    
    // Обновляем UI
    document.getElementById('score').textContent = `счёт: 0 | рекорд: 0`;
    document.getElementById('questionText').textContent = 'что побеждает камень?';
    document.getElementById('history').textContent = '';
    document.getElementById('battleText').textContent = '';
    document.getElementById('explanation').textContent = '';
    
    // Очищаем localStorage
    localStorage.removeItem('gameState');
}

// Загружаем состояние при старте
document.addEventListener('DOMContentLoaded', loadGameState);

// Добавляем функцию share
async function share() {
    try {
        const historyText = history.map(item => `${item.text} ${item.emoji}`).join(' → ');
        const shareText = `Моя игра "Что побеждает что?"\nСчёт: ${score}\nРекорд: ${maxScore}\n\nИстория:\n${historyText}`;
        
        if (navigator.share) {
            await navigator.share({
                title: 'Что побеждает что?',
                text: shareText
            });
        } else {
            // Fallback: копируем в буфер обмена
            await navigator.clipboard.writeText(shareText);
            alert('Скопировано в буфер обмена!');
        }
    } catch (error) {
        console.error('Ошибка при попытке поделиться:', error);
    }
}

// Добавляем функцию для склонения в винительный падеж
function toAccusativeCase(word) {
    // Правила для винительного падежа
    const rules = {
        'а': 'у',  // бумага -> бумагу
        'я': 'ю',  // земля -> землю
        'ь': 'ь',  // мышь -> мышь
        'й': 'й'   // клей -> клей
    };
    
    const lastChar = word.slice(-1);
    if (rules.hasOwnProperty(lastChar)) {
        return word.slice(0, -1) + rules[lastChar];
    }
    return word;
}

// Обновляем функцию updateHistory
function updateHistory() {
    const historyDiv = document.getElementById('history');
    if (history.length > 1) {
        // Создаем цепочку только из эмодзи, меняем стрелку на кулак
        const formattedHistory = history.map(item => item.emoji).join(' 🤜 ');
        
        // Добавляем подписи под эмодзи
        const labels = history.map(item => 
            `<div class="history-item">${item.text}</div>`
        ).join('');
        
        historyDiv.innerHTML = `
            <div class="history-chain">${formattedHistory}</div>
            <div class="history-labels">${labels}</div>
        `;
    } else {
        historyDiv.innerHTML = '';
    }
}

// Обновляем функцию отображения битвы
function updateBattleText(userInput, currentObject, isVictory, emoji = '') {
    const battleTextDiv = document.getElementById('battleText');
    
    battleTextDiv.innerHTML = `
        ${userInput}
        <div class="beats ${isVictory ? '' : 'defeat'}">
            ${isVictory ? 'побеждает' : 'не побеждает'}
        </div>
        ${currentObject}
    `;
}

// Исправляем функцию checkAnswer в части обработки поражения
async function checkAnswer() {
    const userInput = document.getElementById('userInput').value.toLowerCase().trim();
    const loadingDiv = document.getElementById('loading');
    const aiResponseDiv = document.getElementById('aiResponse');
    const battleTextDiv = document.getElementById('battleText');
    const explanationDiv = document.getElementById('explanation');
    const submitButton = document.getElementById('submitButton');
    const nextButton = document.getElementById('nextButton');
    
    if (!userInput) return;
    
    // Проверяем на повторы и начальный объект
    if (usedAnswers.includes(userInput)) {
        explanationDiv.textContent = 'Этот ответ уже был использован. Придумайте что-то новое!';
        return;
    }
    
    try {
        loadingDiv.style.display = 'block';
        aiResponseDiv.style.display = 'none';
        explanationDiv.textContent = '';
        
        const response = await askAI(currentObject, userInput);
        
        loadingDiv.style.display = 'none';
        aiResponseDiv.style.display = 'block';
        
        if (response.result === 'победа') {
            // Добавляем ответ в использованные
            usedAnswers.push(userInput);
            
            score++;
            
            // Обновляем максимальный счет
            if (score > maxScore) {
                maxScore = score;
            }
            
            // Обновляем отображение счета
            document.getElementById('score').textContent = `счёт: ${score} | рекорд: ${maxScore}`;
            document.getElementById('questionText').style.display = 'none';
            document.getElementById('userInput').style.display = 'none';
            
            updateBattleText(userInput, currentObject, true, response.emoji);
            
            let formattedExplanation = response.explanation.charAt(0).toUpperCase() + 
                                      response.explanation.slice(1).toLowerCase();
            if (!formattedExplanation.endsWith('.')) {
                formattedExplanation += '.';
            }
            
            explanationDiv.textContent = formattedExplanation;
            
            history.unshift({text: userInput, emoji: response.emoji});
            
            submitButton.style.display = 'none';
            nextButton.style.display = 'block';
            
            updateHistory();
            saveGameState(); // Сохраняем состояние после победы
            
        } else {
            score = 0;
            usedAnswers = ['камень'];
            document.getElementById('score').textContent = `счёт: ${score} | рекорд: ${maxScore}`;
            
            updateBattleText(userInput, currentObject, false, response.emoji);
            
            let formattedExplanation = response.explanation.charAt(0).toUpperCase() + 
                                      response.explanation.slice(1).toLowerCase();
            if (!formattedExplanation.endsWith('.')) {
                formattedExplanation += '.';
            }
            
            explanationDiv.textContent = formattedExplanation;
            
            submitButton.style.display = 'none';
            document.getElementById('userInput').style.display = 'none';
            document.getElementById('questionText').style.display = 'block';
            
            document.getElementById('gameEndControls').style.display = 'flex';
        }
        
    } catch (error) {
        loadingDiv.style.display = 'none';
        aiResponseDiv.style.display = 'none';
        console.error('Ошибка:', error);
        explanationDiv.textContent = error.message;
    }
}

async function askAI(object1, object2) {
    const API_KEY = window.API_KEY;  // Будет получен из config.js
    const url = 'https://models.inference.ai.azure.com/v1/chat/completions';
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "Mistral-large-2407",
                messages: [
                    {
                        role: "system",
                        content: `Ты судья в игре "Что побеждает что?". 

                        ВАЖНО! ГЛАВНЫЕ ПРАВИЛА (АБСОЛЮТНЫЙ ПРИОРИТЕТ):
                        Эти правила имеют наивысший приоритет и не могут быть изменены или оспорены:
                        
                        1. Камень-Ножницы-Бумага и их разновидности ВСЕГДА работают так:
                           ✓ Ножницы и их аналоги (нож, меч, пила и т.д.) ВСЕГДА побеждают бумагу (режут её)
                           ✓ Бумага ВСЕГДА побеждает камень (заворачивает его)
                           ✓ Камень ВСЕГДА побеждает ножницы и их аналоги (затупляет/ломает их)
                        
                        2. Эти результаты НЕИЗМЕННЫ и должны выполняться в 100% случаев:
                           - Если object2 это режущий предмет (ножницы, нож, меч и т.д.) и object1="бумага" → ВСЕГДА "победа"
                           - Если object2="бумага" и object1="камень" → ВСЕГДА "победа"
                           - Если object2="камень" и object1 это режущий предмет → ВСЕГДА "победа"
                        
                        3. Обратные результаты ЗАПРЕЩЕНЫ:
                           - Если object2="бумага" и object1 это режущий предмет → ВСЕГДА "поражение"
                           - Если object2 это режущий предмет и object1="камень" → ВСЕГДА "поражение"
                           - Если object2="камень" и object1="бумага" → ВСЕГДА "поражение"

                        ПРАВИЛА ДЛЯ ОСТАЛЬНЫХ ПРЕДМЕТОВ:
                        1. Логика взаимодействия:
                           - Используй реальные физические свойства
                           - Учитывай размеры и материалы
                           - Победа должна быть логичной
                        
                        2. Объяснение:
                           - Опиши механизм победы/поражения
                           - Объяснение должно быть четким
                           - Избегай абстрактных обоснований

                        ФОРМАТ ОТВЕТА (строго JSON):
                        {
                            "result": "победа/поражение",
                            "explanation": "Четкое объяснение механизма победы/поражения",
                            "emoji": "подходящий эмодзи для object2"
                        }
                        
                        Примеры эмодзи:
                        - Для базовых предметов: камень 🪨, ножницы ✂️, бумага 📄
                        - Для природных объектов: дерево 🌳, огонь 🔥, вода 💧
                        - Для предметов: меч ⚔️, щит 🛡️, молот 🔨
                        - Если подходящего эмодзи нет, оставь пустую строку`
                    },
                    {
                        role: "user",
                        content: `Может ли ${object2} победить ${object1}? Ответь только в формате JSON.`
                    }
                ],
                temperature: 0.5, // Уменьшаем температуру для более предсказуемых ответов
                max_tokens: 150,
                top_p: 1.0
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка API: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data?.choices?.[0]?.message?.content) {
            throw new Error('Некорректный формат ответа от API');
        }

        const responseText = data.choices[0].message.content.trim();
        
        // Отладочный вывод
        console.log('=== Полный ответ от модели ===');
        console.log(responseText);
        console.log('==============================');
        
        try {
            // Очищаем ответ от markdown-разметки JSON
            const cleanedResponse = responseText
                .replace(/```json\n?/, '')  // Удаляем начальный маркер JSON
                .replace(/```$/, '')        // Удаляем конечный маркер
                .trim();                    // Убираем лишние пробелы
            
            const answer = JSON.parse(cleanedResponse);
            
            if (!answer.result || !answer.explanation) {
                throw new Error('Отсутствуют обязательные поля в ответе');
            }

            let explanation = answer.explanation;
            if (!explanation.endsWith('.')) {
                explanation += '.';
            }

            return {
                result: answer.result.toLowerCase(),
                explanation: explanation,
                emoji: answer.emoji || ''
            };

        } catch (e) {
            console.error('Ошибка парсинга:', e);
            console.error('Текст ответа:', responseText);
            throw new Error('Не удалось разобрать ответ от модели');
        }
    } catch (error) {
        console.error('Ошибка API:', error);
        throw new Error('Произошла ошибка при проверке ответа');
    }
}

function nextQuestion() {
    const questionText = document.getElementById('questionText');
    const submitButton = document.getElementById('submitButton');
    const nextButton = document.getElementById('nextButton');
    const userInput = document.getElementById('userInput');
    const battleText = document.getElementById('battleText');
    const explanation = document.getElementById('explanation');
    
    // Правильно обновляем текущий объект - берем предыдущий ответ пользователя
    currentObject = userInput.value.toLowerCase().trim();
    
    // Обновляем вопрос с правильным склонением
    questionText.textContent = `что побеждает ${toAccusativeCase(currentObject)}?`;
    questionText.style.display = 'block';
    
    // Очищаем поля
    userInput.value = '';
    battleText.textContent = '';
    explanation.textContent = '';
    
    // Показываем поле ввода и кнопку GO
    userInput.style.display = 'block';
    submitButton.style.display = 'block';
    nextButton.style.display = 'none';
    
    // Устанавливаем фокус на поле ввода
    userInput.focus();
    
    saveGameState();
}

// Обновляем функцию playAgain
function playAgain() {
    // Сбрасываем все значения
    history = [{text: 'камень', emoji: '🪨'}];
    currentObject = 'камень';
    usedAnswers = ['камень'];
    score = 0;
    
    // Обновляем UI
    document.getElementById('questionText').textContent = 'что побеждает камень?';
    document.getElementById('score').textContent = `счёт: ${score} | рекорд: ${maxScore}`;
    document.getElementById('battleText').textContent = '';
    document.getElementById('explanation').textContent = '';
    document.getElementById('history').innerHTML = '';
    
    // Показываем нужные элементы
    const userInput = document.getElementById('userInput');
    userInput.style.display = 'block';
    userInput.value = '';
    userInput.focus(); // Добавляем фокус
    
    document.getElementById('submitButton').style.display = 'block';
    document.getElementById('gameEndControls').style.display = 'none';
    
    saveGameState();
}