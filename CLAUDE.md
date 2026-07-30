# Arbejdsregler for dette repo

Læs disse før du rører noget. De er skrevet efter konkrete fejl, ikke som god tone.

## 1. Hent den nyeste udgave først

Start **altid** en ny samtale med at hente den aktuelle tilstand ned:

```bash
git fetch origin master && git status
```

Arbejd aldrig videre på en antagelse om hvad der ligger på master. Der kan være
sket ændringer i en anden samtale siden sidst.

## 2. Slet aldrig noget på baggrund af en websøgning

Ændringer der fjerner, erstatter eller nedgraderer noget der virker, skal
bygge på noget du **har verificeret** — en test, et kald der svarer, en fil du
har læst. Ikke på et søgeresultat.

Det gælder især API-versioner. Google Ads blev engang hævet fra v23 til v24
alene fordi en søgning sagde v24 fandtes. v23 virkede. Resultatet var at
data holdt op med at komme.

Kan du ikke teste det, så lad være med at ændre det — eller læg det bag en
miljøvariabel med den kendte værdi som standard, så det kan rulles frem uden
en kodeændring.

**Det skal ikke gøres hurtigt. Det skal gøres korrekt.**

## 3. Push altid til master

Vercel er git-forbundet til `master` og bygger automatisk ved hver push.
Arbejde der ikke er pushet, kommer ikke i produktion.

```bash
git push -u origin master
```

Brug **aldrig** force-push. En force-push i juni 2026 slettede commits
`63f47eb` og `edc9c1b` fra historikken; de kunne ikke hentes tilbage, og
siderne måtte bygges op igen fra screenshots. Brug `git revert`, ikke
`git reset --hard` efterfulgt af en force-push.

## Diagnose af API-integrationer

Åbn `/api/health` på deploymentet. Det kalder Meta, Google Ads og LinkedIn og
viser den rå fejl fra hver, plus hvilke versioner og miljøvariabler der er i brug.
Brug det frem for at gætte ud fra fejlbeskeder i UI'et.

## API-versioner

Alle versioner står i `src/lib/api/versions.ts` og **kun** der. De lå tidligere
spredt i fire filer, hvilket to gange betød at en opdatering kun ramte nogle af
dem. Hardkod aldrig en version i en `src/lib/api/*.ts`-fil.

Alle tre kan overstyres i Vercel uden en kodeændring:
`META_API_VERSION`, `GOOGLE_ADS_API_VERSION`, `LINKEDIN_API_VERSION`.

## Data der ikke kommer fra API'et

TV2 Play har intet API. Tallene indtastes manuelt og gemmes i browserens
localStorage under `kendskab_tv2_data`, og YouTubes rækkevidde under
`kendskab_manual_reaches`.

Det betyder at de **følger domænet**. Skifter produktionen til en anden URL,
står felterne tomme indtil de tastes ind igen. Enhedsfordelingen for TV2 ligger
derimod i `src/lib/config/kendskabs.ts` og er versionsstyret.

## Nye felter på eksisterende API-kald

Tilføjer du et felt til en forespørgsel der virker, så pak det ind så et afslag
ikke vælter hele kaldet. Både Meta og Google afviser **hele** forespørgslen hvis
ét felt er ugyldigt. Se `fetchMetaBreakdown` og `fetchGoogleDeviceStats` for
mønsteret: prøv med det nye felt, fald tilbage uden det.
