import os
import sqlite3
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
from PIL import Image, ImageDraw
import spacy
from gtts import gTTS
import yaml

from aiogram import Bot, Dispatcher, types
from aiogram.contrib.fsm_storage.memory import MemoryStorage
from aiogram.dispatcher import FSMContext
from aiogram.dispatcher.filters.state import State, StatesGroup
from aiogram.utils import executor

# Загрузка модели NLP
nlp = spacy.load("ru_core_news_sm")

# Настройка логов
logging.basicConfig(level=logging.INFO)

# Загрузка конфигурации
with open("config.yaml", "r") as f:
    config = yaml.safe_load(f)

# Инициализация FSM
storage = MemoryStorage()
load_dotenv()
bot = Bot(token=os.getenv("TELEGRAM_TOKEN"))
dp = Dispatcher(bot, storage=storage)

# Состояния
class AddItem(StatesGroup):
    waiting_for_photo = State()
    waiting_for_description = State()
    waiting_for_location = State()

class FindItem(StatesGroup):
    waiting_for_query = State()

class SetupMap(StatesGroup):
    waiting_for_map = State()
    waiting_for_coords = State()

# Инициализация БД
def init_db():
    conn = sqlite3.connect('home_finder.db')
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        name TEXT,
        description TEXT,
        photo_id TEXT,
        tags TEXT,
        location TEXT,
        map_x INTEGER,
        map_y INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS maps (
        user_id INTEGER PRIMARY KEY,
        map_image TEXT,
        width INTEGER,
        height INTEGER
    )
    ''')
    
    conn.commit()
    conn.close()

init_db()

# Генерация тегов
def generate_tags(text):
    doc = nlp(text)
    tags = [token.lemma_.lower() for token in doc if token.pos_ in ("NOUN", "PROPN") and not token.is_stop]
    return list(set(tags))[:5]

# Добавление метки на карту
def mark_on_map(user_id, x, y):
    conn = sqlite3.connect('home_finder.db')
    cursor = conn.cursor()
    cursor.execute("SELECT map_image, width, height FROM maps WHERE user_id = ?", (user_id,))
    map_data = cursor.fetchone()
    
    if map_data:
        map_path, width, height = map_data
        img = Image.open(map_path)
        draw = ImageDraw.Draw(img)
        draw.ellipse((x-10, y-10, x+10, y+10), outline='red', width=3)
        marked_path = f"maps/marked_{user_id}.jpg"
        img.save(marked_path)
        return marked_path
    return None

# Голосовое сообщение
def create_voice_response(text):
    tts = gTTS(text=text, lang='ru')
    voice_path = f"voice/{datetime.now().strftime('%Y%m%d%H%M%S')}.mp3"
    tts.save(voice_path)
    return voice_path

# ================== КОМАНДЫ ================== #
@dp.message_handler(commands=['start'])
async def cmd_start(message: types.Message):
    text = (
        "🏠 *Добро пожаловать в HomeFinderBot!*\n"
        "Я помогу найти потерянные вещи в вашем доме.\n\n"
        "🔹 *Основные команды:*\n"
        "/add - Добавить новую вещь\n"
        "/find - Найти вещь\n"
        "/map - Настроить карту квартиры\n"
        "/cleanup - Показать забытые вещи"
    )
    await message.answer(text, parse_mode="Markdown")

@dp.message_handler(commands=['map'])
async def cmd_map(message: types.Message):
    await SetupMap.waiting_for_map.set()
    await message.answer("📱 Загрузите схему вашей квартиры (изображение):")

@dp.message_handler(state=SetupMap.waiting_for_map, content_types=types.ContentType.PHOTO)
async def process_map_photo(message: types.Message, state: FSMContext):
    if message.photo:
        photo = message.photo[-1]
        os.makedirs("maps", exist_ok=True)
        map_path = f"maps/map_{message.from_user.id}.jpg"
        await photo.download(destination_file=map_path)
        
        await state.update_data(map_path=map_path)
        await SetupMap.next()
        await message.answer("📍 Отправьте координаты места для метки в формате: X Y\n(Например: 150 200)")

@dp.message_handler(state=SetupMap.waiting_for_coords)
async def process_map_coords(message: types.Message, state: FSMContext):
    try:
        x, y = map(int, message.text.split())
        user_data = await state.get_data()
        map_path = user_data['map_path']
        
        # Сохраняем в БД
        conn = sqlite3.connect('home_finder.db')
        cursor = conn.cursor()
        
        # Получаем размеры изображения
        with Image.open(map_path) as img:
            width, height = img.size
        
        cursor.execute(
            "INSERT OR REPLACE INTO maps (user_id, map_image, width, height) VALUES (?, ?, ?, ?)",
            (message.from_user.id, map_path, width, height)
        )
        conn.commit()
        conn.close()
        
        await state.finish()
        await message.answer("✅ Карта успешно сохранена! Теперь вы можете добавлять вещи.")
    except Exception as e:
        await message.answer(f"❌ Ошибка: {str(e)}")

@dp.message_handler(commands=['add'])
async def cmd_add(message: types.Message):
    await AddItem.waiting_for_photo.set()
    await message.answer("📸 Сфотографируйте вещь:")

@dp.message_handler(state=AddItem.waiting_for_photo, content_types=types.ContentType.PHOTO)
async def process_item_photo(message: types.Message, state: FSMContext):
    photo = message.photo[-1]
    await state.update_data(photo_id=photo.file_id)
    await AddItem.next()
    await message.answer("✍️ Опишите вещь и место хранения:\nПример: 'Паспорт в синей папке на верхней полке шкафа'")

@dp.message_handler(state=AddItem.waiting_for_description)
async def process_item_description(message: types.Message, state: FSMContext):
    user_data = await state.get_data()
    tags = generate_tags(message.text)
    
    await state.update_data(description=message.text, tags=",".join(tags))
    await AddItem.next()
    
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
    markup.add("Гостиная", "Спальня", "Кухня", "Ванная", "Кабинет")
    await message.answer("📍 Выберите комнату или отправьте своё описание:", reply_markup=markup)

@dp.message_handler(state=AddItem.waiting_for_location)
async def process_item_location(message: types.Message, state: FSMContext):
    user_data = await state.get_data()
    
    # Сохраняем в БД
    conn = sqlite3.connect('home_finder.db')
    cursor = conn.cursor()
    
    cursor.execute('''
    INSERT INTO items (user_id, name, description, photo_id, tags, location, last_used)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        message.from_user.id,
        user_data.get('name', 'Без названия'),
        user_data['description'],
        user_data['photo_id'],
        user_data['tags'],
        message.text,
        datetime.now()
    ))
    
    conn.commit()
    conn.close()
    
    await state.finish()
    await message.answer(f"✅ Вещь сохранена! Теги: {user_data['tags']}", reply_markup=types.ReplyKeyboardRemove())

@dp.message_handler(commands=['find'])
async def cmd_find(message: types.Message):
    await FindItem.waiting_for_query.set()
    await message.answer("🔍 Что ищем? Опишите вещь или используйте голосовое сообщение:")

@dp.message_handler(state=FindItem.waiting_for_query, content_types=[types.ContentType.TEXT, types.ContentType.VOICE])
async def process_find_query(message: types.Message, state: FSMContext):
    if message.voice:
        # В реальном проекте добавить распознавание речи
        await message.answer("🔇 Голосовой поиск временно недоступен. Используйте текст.")
        return
    
    query = message.text.lower()
    conn = sqlite3.connect('home_finder.db')
    cursor = conn.cursor()
    
    # Поиск по тегам
    cursor.execute("SELECT * FROM items WHERE user_id = ?", (message.from_user.id,))
    items = cursor.fetchall()
    
    results = []
    for item in items:
        item_id, _, name, description, photo_id, tags, location, *_, last_used = item
        if query in tags or query in description.lower():
            results.append(item)
    
    if results:
        for item in results[:3]:  # Показываем первые 3 результата
            _, _, name, description, photo_id, _, location, *_, _ = item
            await bot.send_photo(
                chat_id=message.chat.id,
                photo=photo_id,
                caption=f"📍 *{location}*\n{description}",
                parse_mode="Markdown"
            )
            
            # Голосовой ответ
            voice_path = create_voice_response(f"Вещь находится в {location}. {description}")
            await bot.send_voice(chat_id=message.chat.id, voice=open(voice_path, 'rb'))
            os.remove(voice_path)
    else:
        await message.answer("😢 Ничего не найдено. Попробуйте другие ключевые слова.")
    
    await state.finish()

@dp.message_handler(commands=['cleanup'])
async def cmd_cleanup(message: types.Message):
    conn = sqlite3.connect('home_finder.db')
    cursor = conn.cursor()
    
    month_ago = datetime.now() - timedelta(days=30)
    cursor.execute("SELECT * FROM items WHERE user_id = ? AND last_used < ?", 
                  (message.from_user.id, month_ago))
    old_items = cursor.fetchall()
    
    if old_items:
        response = "📅 Вещи, которые вы не использовали больше месяца:\n\n"
        for item in old_items:
            _, _, name, _, _, _, location, *_, _ = item
            response += f"• {name} ({location})\n"
        
        await message.answer(response)
    else:
        await message.answer("🎉 Все ваши вещи использовались недавно! Ничего не забыто.")

if __name__ == '__main__':
    os.makedirs("maps", exist_ok=True)
    os.makedirs("voice", exist_ok=True)
    executor.start_polling(dp, skip_updates=True)
