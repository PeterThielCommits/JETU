# JETU без собственного домена — полный практический гайд

**Дата:** 2026-11-21
**Область:** довести JETU до максимально проверяемого MVP, не покупая домен и
не настраивая DNS. Это инструкция, а не подтверждение фаз: статус меняется
только после реального прогона и записи evidence.

## 0. Короткий ответ

Да, почти весь путь можно пройти на чужих/бесплатных доменах:

| Что нужно                     | Без своего домена                           | Годится для                                       |
| ----------------------------- | ------------------------------------------- | ------------------------------------------------- |
| Сайт приложения               | `https://<project>.vercel.app`              | staging, demo, приёмка                            |
| Supabase Auth/API/Storage     | `https://<ref>.supabase.co`                 | всё, кроме брендированного production             |
| Письма Supabase Auth          | Resend + `onboarding@resend.dev`            | только письма на email владельца Resend           |
| Google OAuth                  | Google Cloud OAuth в режиме **Testing**     | до 100 заранее добавленных тестовых пользователей |
| ClamAV                        | локальный ПК или VPS без входящего порта    | проверка файлов и worker                          |
| Staging                       | отдельный Supabase project + `*.vercel.app` | приёмка перед production                          |
| Production-бренд, письма всем | **нельзя** без своего домена                | остаётся открытым пунктом GO_LIVE                 |

Главное ограничение: **Resend test domain не отправит письмо чужому студенту**.
Он принимает только email владельца аккаунта Resend. Поэтому подтверждение
регистрации можно проверить на своём email, но настоящую email-рассылку
студентам без домена запустить нельзя.

---

## 1. Что уже закрыто, а что осталось

На 2026-11-21 в репозитории и на development-проекте
`edpuovkgoisyzpguksdi` реально проверено:

- `npm run check`: Prettier, ESLint 0 warnings, strict TypeScript,
  **268/268** unit/integration, production build (108 страниц).
- `npm run test:e2e`: **106/106**.
- `npm run test:journey-ui`: **35/35**.
- Hosted acceptance: **26/26** базовый Auth/profile/calendar/Vault/deadline,
  **7/7** перенос личной даты, **8/8** RLS/роли, **5/5** Storage isolation,
  **12/12** удаление профиля и каскад истории версий.
- ClamAV 1.5.5 локально: clean-файл released, контролируемая сигнатура
  rejected; EICAR был заблокирован Windows Defender до чтения ClamAV.
- Только **Phase 05** имеет статус VERIFIED. Phases 08, 09, 19, 23 —
  IMPLEMENTED_AND_TESTED, потому что остаются account deletion, email,
  production scanner, backup/restore и др.

Открытые блокеры, которые не решаются доменом:

1. Полное удаление аккаунта (все private Storage objects + Auth user).
2. Показ влияния профиля на eligibility.
3. Email-канал приложения: нет адаптера и нет домена для чужих адресов.
4. Google OAuth: кода нет; есть только будущая конфигурация.
5. Официальный corpus: 0 опубликованных programs и 0 scholarships.
6. Staging Supabase project и backup/restore drill.
7. Production deploy и юридическая проверка.

---

## 2. Секреты: куда класть и как не слить

Все секреты держи **вне репозитория**, в
`C:\Users\Admin\.secrets\jetu\`. Не вставляй их в чат, issue, PR, логи или
`.env.local` в Git.

```powershell
$root = 'C:\Users\Admin\.secrets\jetu'
New-Item -ItemType Directory -Force $root | Out-Null
icacls $root /inheritance:r
icacls $root /grant:r "$env:USERNAME:(OI)(CI)F"
```

Рекомендуемые файлы:

```text
C:\Users\Admin\.secrets\jetu\
  resend.api.key
  vercel.token
  google.client.id
  google.client.secret
  supabase.staging.url
  supabase.staging.publishable
  supabase.staging.secret
  supabase.production.url
  supabase.production.publishable
  supabase.production.secret
  clamav.runtime.path
```

Запись значения без вывода в консоль:

```powershell
Set-Content -NoNewline "$root\resend.api.key" 're_ВСТАВЬ_КЛЮЧ_ЗДЕСЬ'
```

Чтение в текущую сессию:

```powershell
$env:RESEND_API_KEY = (Get-Content "$root\resend.api.key" -Raw).Trim()
```

**Срочно:** ключ `SUPABASE_SECRET_KEY`, который ранее был вставлен в чат,
считай скомпрометированным. Создай новый secret key в Supabase Dashboard →
Project Settings → API Keys, обнови `.env.local`, Vercel и worker, старый
отзови. Проверь, что в Git нет реальных ключей:

```powershell
git grep -n -I -E 'sb_secret_|re_[A-Za-z0-9]{20,}|GOCSPX-'
```

---

## 3. Карта окружения без домена

```text
Браузер
  |
  | https://jetu-staging.vercel.app
  v
Next.js на Vercel
  |
  | NEXT_PUBLIC_SUPABASE_URL=https://<staging-ref>.supabase.co
  v
Supabase (Auth, Postgres, Storage)
  |
  +-- Resend SMTP: smtp.resend.com:465
  +-- Google OAuth callback:
      https://<staging-ref>.supabase.co/auth/v1/callback

ClamAV worker (локальный ПК / VPS)
  |
  | SUPABASE_SECRET_KEY (только server-side)
  v
Supabase Storage -> vault_versions -> available/rejected
```

Три разных URL, которые нельзя путать:

1. **App URL** — `https://<project>.vercel.app`.
2. **Supabase URL** — `https://<ref>.supabase.co`.
3. **OAuth callback в Google** — ровно
   `https://<ref>.supabase.co/auth/v1/callback`, а не app URL.

---

## 4. Resend без домена

### 4.1. Что можно и что нельзя

Можно:

- отправить письмо на email, которым зарегистрирован сам Resend-аккаунт;
- проверить Supabase confirmation/reset письма на своём адресе;
- проверить, что SMTP-конфигурация и шаблоны работают.

Нельзя:

- отправить письмо другому студенту;
- использовать `onboarding@resend.dev` для реальной рассылки;
- пройти hosted acceptance email-канала с двумя разными ящиками.

Официальное ограничение Resend: с `resend.dev` можно писать только на email
владельца аккаунта; остальные получатели дают 403. Free-план: 100 писем в
день / 3 000 в месяц, но тестовый домен всё равно остаётся тестовым.

### 4.2. Аккаунт и ключ

1. Зарегистрируйся на `resend.com` **на свой реальный email**.
2. Подтверди email.
3. Dashboard → API Keys → Create API Key.
4. Name: `jetu-dev-smtp`; Permission: **Sending access**.
5. Скопируй `re_...` в `C:\Users\Admin\.secrets\jetu\resend.api.key`.
6. Домен **не добавляй** — он не нужен для тестового пути.

### 4.3. Supabase SMTP

Supabase Dashboard → проект `edpuovkgoisyzpguksdi` → Authentication → Emails /
SMTP Settings → Enable Custom SMTP:

| Поле         | Значение                |
| ------------ | ----------------------- |
| Host         | `smtp.resend.com`       |
| Port         | `465`                   |
| Username     | `resend`                |
| Password     | твой `re_...` ключ      |
| Sender email | `onboarding@resend.dev` |
| Sender name  | `JETU`                  |

Сохрани. Затем Authentication → Rate Limits: для теста можно поднять
email-лимит, но не ставь бесконечность на публичном окружении.

### 4.4. Проверка SMTP через Resend API

```powershell
$env:RESEND_API_KEY = (Get-Content "$root\resend.api.key" -Raw).Trim()
$body = @{
  from = 'JETU <onboarding@resend.dev>'
  to = @('ТВОЙ_EMAIL@example.com')
  subject = 'JETU SMTP test'
  text = 'If you received this, the Resend test domain works for the account owner.'
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'https://api.resend.com/emails' `
  -Headers @{ Authorization = "Bearer $env:RESEND_API_KEY" } `
  -ContentType 'application/json' -Body $body
```

Ожидаемо: `id` письма и доставка на твой адрес. Если отправить на чужой
адрес — будет 403 с текстом про verify a domain.

### 4.5. Проверка confirmation в приложении

1. Запусти свежий build: `npm run build`, затем `npm run start -- --port 3200`.
2. Открой `http://127.0.0.1:3200/en/signup`.
3. Зарегистрируйся **на свой Resend-email**.
4. Проверь письмо Supabase/Resend и ссылку `/auth/callback`.
5. Убедись, что после перехода открывается onboarding, а не ошибка
   `redirect_to`/`callback`.

Если ссылка ведёт не туда, проверь Supabase → Authentication → URL
Configuration:

- Site URL: `http://localhost:3000` для локального теста;
- Redirect URLs: `http://localhost:3000/**`,
  `http://127.0.0.1:3200/**`, затем URL Vercel.

Приложение формирует `emailRedirectTo` из `NEXT_PUBLIC_APP_URL`, поэтому на
Vercel это значение должно совпадать с фактическим адресом приложения.

### 4.6. Email-канал приложения (ещё не реализован)

Supabase SMTP закрывает только Auth-письма. Для дедлайнов нужен отдельный
adapter:

1. Добавить в `notification_jobs.channel` допустимое значение `email`
   (сейчас constraint разрешает только `in_app`) и таблицу/поля delivery
   tracking: `provider_message_id`, `delivered_at`, `bounced_at`,
   `last_error_code`.
2. Создать `src/lib/email/provider.ts` с интерфейсом
   `sendEmail({ to, subject, text, html, idempotencyKey })`.
3. Вызывать Resend `POST https://api.resend.com/emails` только на сервере;
   ключ читать из `RESEND_API_KEY`, никогда не из `NEXT_PUBLIC_*`.
4. Отправлять только после явного consent в notification preferences.
5. Обрабатывать 429/5xx с retry/backoff и хранить статус; не помечать
   `sent`, пока провайдер не вернул id.
6. Добавить webhook Resend для delivered/bounced/complained (проверять
   подпись) или, как минимум, не считать письмо доставленным по факту
   постановки в очередь.
7. Тест без домена: только на свой email. Для второго получателя нужен
   verified domain — это честный блокер.

---

## 5. Vercel без домена

### 5.1. Подготовка

```powershell
node -v          # 24.19.x
npm -v           # 11.9.x
npm ci
npm run check
```

Установи и войди:

```powershell
npm install -g vercel
vercel login
vercel whoami
```

### 5.2. Два проекта

Не смешивай staging и production в одном Vercel-проекте.

| Проект         | Git branch                      | Supabase project  | URL                               |
| -------------- | ------------------------------- | ----------------- | --------------------------------- |
| `jetu-staging` | `codex/mvp-closure-integration` | новый staging ref | `https://jetu-staging.vercel.app` |
| `jetu`         | `main` после merge              | production ref    | `https://jetu.vercel.app`         |

Для staging: Vercel Dashboard → Add New → Project → Import Git Repository →
выбери репозиторий JETU → Root Directory оставь корнем репозитория (не
`jetu/`) → Framework `Next.js` → создай проект. Затем Settings → Git →
Production Branch = нужная ветка.

Без своего домена Vercel выдаст `*.vercel.app`. Это и есть адрес приложения;
DNS не нужен.

### 5.3. Environment Variables

В Vercel → Project → Settings → Environment Variables добавь для
**Production** и **Preview** (значения из `.secrets`, не из чата):

```text
NEXT_PUBLIC_APP_URL=https://jetu-staging.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://<staging-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_...>
SUPABASE_SECRET_KEY=<sb_secret_...>
JETU_PUBLIC_INDEXING=false
```

Правила:

- `NEXT_PUBLIC_*` видны браузеру; там только publishable key.
- `SUPABASE_SECRET_KEY` — только server-side; никогда не `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_APP_URL` должен быть **стабильным URL проекта**, иначе
  confirmation/reset ссылки уйдут на localhost или чужой preview.
- Для preview-деплоев, если нужны рабочие письма, либо задай
  `NEXT_PUBLIC_APP_URL` на стабильный staging alias, либо не тестируй письма
  на случайном preview URL.

CLI-вариант (значение вводится в prompt, не печатается в историю):

```powershell
vercel link
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
vercel env add SUPABASE_SECRET_KEY production
```

Для Preview повтори с `preview`. После добавления сделай redeploy: старые
deployment’ы не получают новые env автоматически.

### 5.4. Supabase URL Configuration

Supabase Dashboard → Authentication → URL Configuration:

```text
Site URL:
  https://jetu-staging.vercel.app

Redirect URLs:
  http://localhost:3000/**
  http://127.0.0.1:3200/**
  https://jetu-staging.vercel.app/**
  https://*-<vercel-team-slug>.vercel.app/**
```

Wildcard для preview удобен, но широк: включай его только для staging и
понимай, что любой preview-домен команды сможет быть redirect target. Для
production лучше перечислить точные домены.

### 5.5. Deploy и smoke

Первый preview:

```powershell
vercel
```

Staging alias:

```powershell
vercel alias set <deployment-url> jetu-staging.vercel.app
```

Проверки:

```powershell
curl.exe -i https://jetu-staging.vercel.app/api/health
curl.exe -i https://jetu-staging.vercel.app/en/dashboard
curl.exe -i https://jetu-staging.vercel.app/en
```

Ожидаемо:

- `/api/health` → 200;
- `/en/dashboard` без сессии → redirect на `/en/login`;
- публичные страницы открываются;
- в HTML нет `SUPABASE_SECRET_KEY`, `sb_secret_`, `re_`;
- вход/выход, onboarding, Vault upload, календарь работают на staging.

**Deployment Protection:** если Vercel включает защиту preview, письма и
внешние проверки могут получать 401. Для staging либо выключи protection,
либо используй стабильный alias без защиты. Не отключай защиту на production
без отдельного решения.

### 5.6. Production

`vercel --prod` — это уже production deploy, даже если домен
`*.vercel.app`. Не запускай его без отдельного явного разрешения. Домен не
нужен технически, но GO_LIVE требует подтверждённого владельца
домена/DNS/TLS; с `vercel.app` этот пункт остаётся открытым.

---

## 6. Google OAuth без домена

### 6.1. Google Cloud

1. Создай проект в Google Cloud Console.
2. APIs & Services → OAuth consent screen → **External**.
3. Заполни App name, User support email, Developer contact.
4. Publishing status оставь **Testing**.
5. Добавь Test users — до 100 аккаунтов, которые смогут войти.
6. Credentials → Create credentials → OAuth client ID → Web application.

Authorized JavaScript origins:

```text
http://localhost:3000
http://127.0.0.1:3200
https://jetu-staging.vercel.app
```

Authorized redirect URI — **точно один**:

```text
https://<staging-ref>.supabase.co/auth/v1/callback
```

Для development-проекта это:

```text
https://edpuovkgoisyzpguksdi.supabase.co/auth/v1/callback
```

Не добавляй сюда `/auth/callback` приложения: Google возвращает код в
Supabase, а Supabase — в приложение.

### 6.2. Supabase provider

Supabase Dashboard → Authentication → Providers → Google:

- Enable;
- Client ID и Client Secret из Google;
- скопируй показанный callback URL и сверь с Google;
- сохранить.

### 6.3. Код приложения

Сейчас OAuth-кода нет. Минимально нужно:

1. Кнопка «Continue with Google» в login/signup.
2. Server action:

```ts
'use server';
import { redirect } from 'next/navigation';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { getPublicEnv } from '@/lib/env/public';

export async function signInWithGoogle(locale: string) {
  const supabase = await createRequestSupabaseClient();
  const callback = new URL(
    '/auth/callback',
    getPublicEnv().NEXT_PUBLIC_APP_URL,
  );
  callback.searchParams.set('next', `/${locale}/onboarding`);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callback.toString() },
  });
  if (error || !data.url) redirect(`/${locale}/login?error=oauth`);
  redirect(data.url);
}
```

3. Проверить, что `/auth/callback` обменивает `code` на сессию (этот route
   уже есть).
4. Добавить consent/privacy текст и тест: вход тестовым Google-аккаунтом,
   reload, выход.

### 6.4. Ограничения без домена

- Testing: только 100 заранее добавленных test users; остальные получат
  отказ.
- Публичный вход требует Publishing status → In production и может
  потребовать verification/privacy policy; бренд будет показывать
  `supabase.co`, а не твой домен.
- Без домена нельзя гарантировать брендированный consent screen. Для
  реального запуска это остаётся открытым.

---

## 7. ClamAV без домена

### 7.1. Windows: уже проверенный путь

ClamAV 1.5.5 установлен через `winget`. `Program Files` может не давать
`freshclam` писать базу, поэтому использовалась копия runtime:

```powershell
$src = 'C:\Program Files\ClamAV'
$dst = "$env:LOCALAPPDATA\ClamAV"
New-Item -ItemType Directory -Force $dst | Out-Null
robocopy $src $dst /E /XF *.pdb *.lib | Out-Null
New-Item -ItemType Directory -Force "$dst\database" | Out-Null
```

`$dst\freshclam.conf`:

```text
DatabaseDirectory "C:\Users\Admin\AppData\Local\ClamAV\database"
CVDCertsDirectory "C:\Users\Admin\AppData\Local\ClamAV\certs"
UpdateLogFile "C:\Users\Admin\AppData\Local\ClamAV\freshclam.log"
LogTime yes
DatabaseMirror database.clamav.net
```

Обновление и проверка:

```powershell
& "$dst\freshclam.exe" --config-file="$dst\freshclam.conf" --stdout
$env:PATH = "$dst;$env:PATH"
clamscan --version
```

Worker:

```powershell
$env:SUPABASE_SECRET_KEY = (Get-Content "$root\supabase.staging.secret" -Raw).Trim()
$env:NEXT_PUBLIC_SUPABASE_URL = (Get-Content "$root\supabase.staging.url" -Raw).Trim()
node scripts/vault-worker.mjs
```

### 7.2. Расписание

Task Scheduler → Create Task:

- Trigger: каждые 5–15 минут;
- Action: `powershell.exe -NoProfile -File C:\path\to\run-vault-worker.ps1`;
- Run whether user is logged on or not;
- Start in: корень репозитория;
- не хранить пароль в скрипте: читать из `.secrets` с ACL.

Отдельно `freshclam` — раз в день или чаще. Worker должен падать закрыто,
если базе больше 7 дней (это уже заложено).

### 7.3. Linux VPS (рекомендуется для постоянной работы)

```bash
sudo apt update
sudo apt install -y clamav clamav-freshclam
sudo systemctl enable --now clamav-freshclam
clamscan --version
```

Дальше — тот же `scripts/vault-worker.mjs`, Node 24, `.env` с secret key,
systemd timer. Входящий порт не нужен; исходящие — к Supabase и mirrors
ClamAV.

### 7.4. Приёмка

1. Загрузи чистый `.txt`/PDF через Vault UI → статус `quarantined`.
2. Запусти worker → `available`, в `scanner` строка ClamAV.
3. Загрузи EICAR. На Linux ClamAV должен вернуть `rejected`.
4. На Windows Defender может заблокировать EICAR до ClamAV; не отключай
   защиту глобально. Для теста используй отдельную временную папку или
   контролируемую `.ndb` сигнатуру, затем удали её.
5. Проверь Storage isolation: анонимный и чужой direct read → 400/403;
   чужой signed URL → отказ; чужие metadata rows → пусто.

### 7.5. Backup/restore drill

Без домена всё равно обязателен:

1. Supabase Dashboard → Database → Backups: включить/проверить daily backup
   (или PITR, если доступно).
2. Снять логический дамп схемы/данных в защищённое место.
3. Скачать/скопировать объекты `student-vault` и `profile-evidence` (или
   сделать проверяемый export).
4. Восстановить в отдельный disposable project/локально.
5. Проверить: профиль, версии, документы, Storage objects, RLS.
6. Записать дату, версию, время восстановления и расхождения.

Без этого Phase 19 не закрывается, даже если сканер работает.

---

## 8. Staging Supabase без домена

### 8.1. Создать отдельный проект

Supabase Dashboard → New project:

- Name: `jetu-staging`;
- Region: ближайший;
- сильный пароль БД в `.secrets`;
- не использовать development project.

Запиши `ref`, URL, publishable key, secret key.

### 8.2. Применить миграции — только с явным разрешением

Правило репозитория: не делать `link`, `db push`, reset или применение
миграций к удалённому проекту без отдельного явного разрешения, в котором
назван **staging ref**. Production — отдельно.

После разрешения:

```powershell
npx supabase link --project-ref <staging-ref>
npx supabase db push --dry-run
npx supabase db push
```

Перед push:

- сверить локальные файлы с remote migration history;
- не переименовывать уже применённые миграции;
- не делать reset;
- выполнить pgTAP/rollback-проверки;
- проверить advisors.

Если CLI не используется, применять через MCP/SQL только точные
проверенные statements и с транзакционной проверкой.

### 8.3. Auth, Storage, types

- Auth URL Configuration — staging Vercel URL.
- SMTP — Resend (для теста только свой email).
- Storage buckets `student-vault`, `profile-evidence` создаются миграциями;
  проверить `public = false`.
- Сгенерировать типы из **staging** и заменить
  `src/lib/supabase/database.types.ts` только после успешной генерации.
- Секреты staging — в Vercel staging, не в Git.

### 8.4. Staging smoke

```powershell
curl.exe -i https://jetu-staging.vercel.app/api/health
```

Затем браузером:

1. anonymous `/en/dashboard` → login;
2. signup на свой email → confirmation → onboarding;
3. save profile → reload;
4. upload clean file → quarantine → worker → available;
5. create personal date → reminder job;
6. inbox read/archive;
7. ICS;
8. cross-user denial (два тестовых аккаунта);
9. profile delete;
10. admin catalog 403 для не-редактора.

---

## 9. Corpus без домена

Домен не поможет с данными. Нужен маленький, но настоящий проверенный corpus.
Минимум для прохождения 12/13/15/16/17/18:

- 3–5 degree programs;
- 2–3 scholarships;
- 1–2 opportunities;
- актуальные deadlines;
- официальные source URL и дата проверки.

Шаблон факта:

```text
entity: program | scholarship | opportunity
official_url:
publisher:
fetched_at:
academic_cycle:
title:
degree_level:
field:
institution:
campus:
language:
tuition + currency + period:
requirements:
tests/thresholds:
deadline + timezone:
funding coverage:
eligibility (citizenship/residency/grade):
source quote / page section:
reviewer:
verification_state: VERIFIED | NEEDS_REVIEW
```

Правила:

- никаких выдуманных требований, дедлайнов и сумм;
- каждая цифра — со ссылкой на официальный источник;
- если источник противоречит — `NEEDS_REVIEW`, не публиковать;
- не переносить старый дедлайн в новый цикл без подтверждения;
- публиковать только через reviewer console;
- проверить, что публичный search/match видит только published+verified.

После публикации:

1. hosted search по каждому entity;
2. program/scholarship detail;
3. save/compare;
4. matching run на тестовом профиле;
5. изменить официальный дедлайн → source-change job → уведомление;
6. откатить/архивировать тестовую запись.

---

## 10. Phase 09: account deletion и eligibility impact

### 10.1. Что уже сделано

Удаление **профиля**:

- кнопка в onboarding;
- диалог подтверждения;
- server action;
- RLS owner delete;
- каскад `student_profile_versions`;
- hosted 12/12;
- unit + journey tests.

Аккаунт при этом не удаляется — это явно написано в UI.

### 10.2. Полное удаление аккаунта (ещё нет)

Нужен отдельный workflow, потому что Auth user и Storage objects не удаляются
каскадом таблиц.

Порядок:

1. Проверить текущего пользователя через request client.
2. Поставить guard-строку в `student_account_deletions` (миграция уже создала
   таблицу). Это блокирует новые uploads.
3. Удалить все объекты пользователя:
   - `profile-evidence/<user_id>/...`;
   - `student-vault/private/student/<user_id>/...` (рекурсивно).
4. Вызвать `admin.auth.admin.deleteUser(user_id)`.
5. Проверить: Auth user 404, профиль/версии/приложения/календарь/Vault rows
   отсутствуют, Storage objects 0.
6. Если шаг 3/4 упал — оставить guard, показать retry, не притворяться, что
   удаление завершено.

Требуется миграция/grants для guard-таблицы и явное разрешение на её
применение к development/staging. Не делать это на production без отдельного
разрешения.

### 10.3. Eligibility impact

Сейчас matching engine умеет `eligible / potentially_eligible /
not_eligible / unknown`, но в development **0 опубликованных programs и
scholarships**, поэтому показывать реальные изменения не на чем.

Честный путь:

1. Добавить в профиль completeness/readiness: какие поля заполнены, какие
   влияют на matching, какие остаются unknown.
2. Пока нет verified rules — показывать `unknown`, а не false reject.
3. После публикации corpus: сохранить matching run до/после изменения
   профиля и показать diff по статусам/баллам.
4. Acceptance: incomplete profile → unknown; заполненный профиль → понятные
   изменения; ни один статус не выдуман.

---

## 11. Порядок выполнения

| Шаг | Действие                                      | Время   | Результат                        |
| --- | --------------------------------------------- | ------- | -------------------------------- |
| 1   | Resend аккаунт + SMTP + письмо себе           | 30 мин  | Auth confirmation на своём email |
| 2   | Vercel staging + env + Supabase URLs          | 45 мин  | `*.vercel.app` staging           |
| 3   | Staging smoke                                 | 30 мин  | hosted evidence                  |
| 4   | Google OAuth Testing + код + тест             | 1–2 ч   | вход тестовым Google-аккаунтом   |
| 5   | ClamAV на постоянном хосте + scheduled worker | 1 ч     | clean/reject + логи              |
| 6   | Backup/restore drill                          | 1–2 ч   | restore evidence                 |
| 7   | Corpus fact sheet + review + publish          | 1–2 дня | реальные programs/scholarships   |
| 8   | Account deletion + eligibility impact         | 1–2 дня | Phase 09 exit                    |
| 9   | Hosted acceptance 12/13/15/16/17/18           | 1 день  | evidence                         |
| 10  | Production review                             | —       | только с отдельным разрешением   |

---

## 12. Команды приёмки

Локально:

```powershell
npm ci
npm run check
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run test:e2e
npm run test:journey-ui
npm audit --omit=dev --audit-level=high
```

Hosted:

```powershell
$env:BASE_URL='https://jetu-staging.vercel.app'
curl.exe -i "$env:BASE_URL/api/health"
```

Browser/REST acceptance должен проверять:

- anonymous redirect;
- signup confirmation (свой email);
- sign-in/out, reload;
- profile save/reload/version;
- profile delete + cancel;
- calendar create/reload/reschedule;
- preferences;
- notification delivery;
- inbox read/archive;
- ICS;
- Vault quarantine/release/reject;
- cross-user denial;
- admin 403;
- source-change replay;
- Storage isolation.

Каждый прогон записывать в
`docs/PHASE_08_09_19_23_HOSTED_ACCEPTANCE.md` с датой, URL, коммитом и
санитизированными результатами.

---

## 13. Что без домена остаётся невозможным

1. **Письма реальным студентам.** Resend test domain — только владельцу
   аккаунта. Нужен verified domain и SPF/DKIM/DMARC.
2. **Публичный Google OAuth без ограничений.** Testing — 100 test users;
   публикация требует verification/privacy policy, бренд будет на
   `supabase.co`.
3. **Брендированный production URL.** `*.vercel.app` — чужой домен, может
   блокироваться школьными сетями, выглядит как demo.
4. **GO_LIVE пункт Domain/DNS/TLS ownership.** Его нельзя закрыть без
   домена; можно закрыть staging/demo, но не production-релиз.
5. **Юридическая и support-готовность.** Домен не заменяет privacy/terms,
   владельца поддержки и incident-процесс.
6. **Реальная email-доставка в Phase 23.** Даже с adapter’ом без домена
   нельзя проверить второго получателя.

Это не причина не делать staging. Это причина не называть staging
production-релизом.

---

## 14. Security checklist

- [ ] Ротирован старый `SUPABASE_SECRET_KEY`.
- [ ] Секреты только в `C:\Users\Admin\.secrets\jetu\`, ACL ограничен.
- [ ] `.env.local` не в Git; `git status` чист от секретов.
- [ ] В Vercel нет `NEXT_PUBLIC_SUPABASE_SECRET_KEY`.
- [ ] RLS включён на всех пользовательских таблицах.
- [ ] Storage buckets private; прямой read чужому/анониму запрещён.
- [ ] Service key используется только в server/worker, не в браузере.
- [ ] Resend key имеет только Sending access.
- [ ] Google client secret не в NEXT_PUBLIC.
- [ ] Vercel preview protection не ломает auth callback.
- [ ] Backup restore проверен, а не только включён.
- [ ] Тестовые пользователи и объекты удалены после приёмки.

---

## 15. Финальный чеклист «максимум без домена»

- [ ] Resend: письмо себе доставлено, Supabase confirmation работает.
- [ ] Vercel staging: health 200, private redirect, вход/выход.
- [ ] Supabase staging: миграции, advisors, типы, RLS.
- [ ] Google OAuth: тестовый пользователь входит, callback корректен.
- [ ] ClamAV: clean → available, infected → rejected, definitions свежие.
- [ ] Backup: restore drill с датой и результатом.
- [ ] Corpus: минимум 3 programs + 2 scholarships опубликованы с источниками.
- [ ] Search/detail/save/compare/match работают на corpus.
- [ ] Source-change уведомление воспроизведено.
- [ ] Profile delete: hosted 12/12 (уже есть).
- [ ] Account delete: все private objects и Auth user удалены.
- [ ] Eligibility: unknown без правил, diff после corpus.
- [ ] `npm run check`, `test:e2e`, `test:journey-ui` зелёные.
- [ ] Все временные QA-аккаунты и объекты удалены.
- [ ] Статусы в `PHASE_TRACKER.md` обновлены только по evidence.
- [ ] Production deploy не выполнен без отдельного разрешения.

Если все пункты выше закрыты, у тебя есть **проверяемый staging/demo MVP без
собственного домена**. Production-релиз всё ещё требует домена, реальной
email-доставляемости и отдельного разрешения.
