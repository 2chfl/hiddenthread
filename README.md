# Стеганографический скрипт
Больше никаких автозамен, вордфильтров, правил, где модератор может забанить любого неугодного. Всё тут ограничивается лишь вашей фантазией.

Для скрытия данных используется стеганография методом LSB в PNG-изображениях.

- Упаковка в пост файлов.
- Шифрование произвольным паролем (`AES256-CBC`).
- Цифровая подпись поста приватным ключом (`ECDSA` `P-256`).
- Отправка приватных сообщений, которые сможет расшифровать только получатель (`ECDH` `P-256`).


## Как установить?
Установите любое из расширений:
* [Violentmonkey](https://violentmonkey.github.io)
* [Tampermonkey](https://www.tampermonkey.net)

Установите скрипт:
* Зайти [сюда](./HiddenThread.user.js) и нажать на `Raw` справа. Кликните на `установить`.
* Откройте любой тред, обновите страницу.
* В треде под обычной формой постинга (не плавающей) появится вторая форма, через которую можно загрузить скрытопосты.

C куклой скрипт работает не очень корректно, можете не выключать, но могут возникать проблемы.

Посредством шифрования ключей доступна личка (когда один постер видит только то, что другой постер ему отправил, ссылаясь на его публичный ключ).

## Как пользоваться?
Для отправки скрытопоста нужно сделать следующие вещи:
1. Написать скрытый текст.
2. Выбрать картинку-контейнер, которая будет контейнером для твоего скрытого поста, пользователям без скрипта в треде будет видна лишь картинка.
    * *Опционально.* Выбрать скрытый файл. Скрытый файл может быть чем угодно, вебм, картинка, любой файл и т.п.
    * *Опционально.* Подписать пост, сгенерировав и сохранив куда-нибудь свои приватные и публичные ключи, чтобы не потерять их при обновлении страницы, чтобы тебе могли писать в местную личку другие анончики. Чтобы написать какому-то анону лично, нужно лишь вставить его ключ, который отображается над его скрытым постом, в графу `Публичный ключ получателя`.
3. Нажать на большую кнопку снизу `Создать картинку со скрытопостом`. Картинка сгенерируется и сама вставится в форму постинга. Остаётся только отправить её. У пользователей с куклоскриптом может не отображаться сгенерированная картинка, поэтому рекомендуется выключить её.


## FAQ
### Как это выглядит?
![](https://i.imgur.com/I3MfqSr.png)

### Зачем нужен пароль?
Пароль создан для тех, кто хочет запилить скрытотред только для своих, для тех кто знает пароль. Либо на случай, когда треды с пустым паролем будут затирать или банить.

### Что такое ключи?
Нажимая на кнопку `Сгенерировать ключи` у вас появляются два ключа.
* `Публичный ключ` - этот ключ доступен всем кто видит ваш пост. Он используется для того чтобы зашифровать сообщение и отравить его вам. Публичный ключ генерируется из приватного, его можно не сохранять.
* `Приватный ключ` - этот ключ должен быть доступен только вам. С помощью него можно расшифровать сообщение, которое было зашифровано публичным ключом.

Кроме того, ключ можно использовать как уникальное имя - никто не сможет подписаться вашим публичным ключом, не зная приватного.