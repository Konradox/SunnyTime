# SunnyTime

Lekka aplikacja dla pilotów paralotniowych pokazująca prawdziwy czas słoneczny,
lokalne południe słoneczne, orientacyjny szczyt termiki (15:00 czasu słonecznego)
i odległość odpowiadającą jednej minucie słonecznej na danej szerokości.

## Uruchomienie

```bash
source ~/.nvm/nvm.sh
nvm use 24
npm install
npm run dev
```

Testy i build produkcyjny:

```bash
npm test
npm run build
```

## Publikacja na GitHub Pages

Projekt zawiera workflow `.github/workflows/deploy-pages.yml`. Po każdym pushu do
gałęzi `master` GitHub Actions uruchomi testy, utworzy katalog `dist` i opublikuje
go na GitHub Pages. Deployment można też uruchomić ręcznie z zakładki **Actions**.

W repozytorium na GitHubie przejdź do **Settings → Pages**, a następnie w sekcji
**Build and deployment** wybierz **GitHub Actions** jako źródło. Po udanym
workflow aplikacja będzie dostępna pod adresem:

`https://konradox.github.io/SunnyTime/`

Geokodowanie wykorzystuje publiczny endpoint Nominatim i jest uruchamiane wyłącznie
po zatwierdzeniu formularza. Wyniki są cache'owane lokalnie. Przy większym ruchu
należy skonfigurować własną instancję/proxy lub komercyjnego dostawcę zgodnego z API.
