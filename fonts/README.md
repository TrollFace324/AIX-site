# Fonts Directory

Эта папка содержит локальные файлы шрифтов для проекта.

## Требуемые шрифты

### Anton (Regular)
- **Файл**: `anton-regular.woff2`
- **Источник**: Google Fonts
- **URL для скачивания**: https://fonts.gstatic.com/s/anton/v25/1Ptgg87LROyAm0K08i4gS7lu.woff2

## Установка

Для установки шрифта Anton выполните:

```powershell
# Скачать шрифт Anton
Invoke-WebRequest -Uri "https://fonts.gstatic.com/s/anton/v25/1Ptgg87LROyAm0K08i4gS7lu.woff2" -OutFile "fonts/anton-regular.woff2"
```

Или вручную:
1. Перейдите на https://fonts.google.com/specimen/Anton
2. Нажмите "Download family"
3. Распакуйте архив
4. Скопируйте файл `Anton-Regular.ttf` и конвертируйте его в WOFF2, или используйте прямой URL выше

## Примечание

Если файл шрифта отсутствует, CSS автоматически использует резервный вариант с Google Fonts CDN.
