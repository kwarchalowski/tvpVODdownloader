# vod-tvp-downloader

Niewielki program pozwalający pobrać na dysk wszystkie, bądź tylko wybrane pozycje z oferty serwisu vod.tvp.pl.

### Serwis streamingowy [vod.tvp.pl](https://vod.tvp.pl/)



***TVP VOD*** – *polski serwis VOD należący do Telewizji Polskiej, uruchomiony w 2010 roku jako podstrona tvp.pl, na której były umieszczane produkcje TVP.*
*(...) Platforma umożliwia odtwarzanie programów własnych TVP oraz licencjonowanych produkcji innych nadawców tj. BBC(...)*

## :bulb: Uruchamianie :bulb:

### Instalacja

Możliwa jest instalacja za pomocą paczki udostępnionej na platformie [npmjs.com](https://www.npmjs.com/package/tvp-vod-downloader).  Wystarczy użyć terminala:

```
npm install tvp-vod-downloader
```


### Argumenty oraz wywołanie programu

Po instalacji: 

```
tvp-vod-downloader URL DIR [bitrate] [first] [last]
```



* **URL** - adres URL do programu (wymagane)

* **DIR** - katalog do którego pobrane zostaną pliki (wymagane)

* ***bitrate*** - określenie bitrate (**min** lub **max**) (opcjonalne)

* ***first*** - numer odcinka od którego rozpocznie się pobieranie (opcjonalne)

* ***last*** - numer odcinka na którym zakończy się pobieranie (opcjonalne)

![picture alt](.images/node-args.png "Argumenty uruchomieniowe programu")


Program uruchamiamy poprzez wywołanie aplikacji tvpdown.js z odpowiednimi argumentami. **Jedynymi wymaganymi** argumentami jest *adres do odcinków* ze strony vod.tvp.pl oraz *folder docelowy*, do którego zostaną pobrane pliki. W przypadku gdy folder nie istnieje, zostanie on utworzony.

Kolejne argumenty (już **opcjonalne**) to odpowiednio wybrany przez nas bitrate (póki co jedynie minimalny/maksymalny (odpowiednio **min** oraz **max**)), numer **odcinka od którego chcemy rozpocząć pobieranie** oraz kolejno numer **odcinka na którym chcemy zakończyć pobieranie**. Program sortuje odcinki według kolejności ich występowania na platformie.

**Jeżeli nie zostanie podany bitrate** (min/max) **lub numery odcinków** - zostaną pobrane **wszystkie pliki** w minimalnym dostępnym aktualnie bitrate.

Ostatni argument możemy też pominąć jeżeli podamy numer początkowego odcinka - *pobrane zostaną wszystkie odcinki od podanego numeru do ostatniego odcinka* dodanego na platformę vod.tvp.pl.

### Adres danego programu

![picture alt](.images/vod-on-site.gif "Adres programu do pobrania")

Jeżeli chcemy ściągnąć interesujący nas program lub odcinki, musimy najpierw wyszukać daną pozycję w serwisie vod.tvp.pl. W tym celu przechodzimy na stronę platformy oraz przechodzimy do sekcji ***Odcinki*** danego programu. Powinna ukazać się lista wszystkich dostępnych odcinków danej produkcji (*patrz: gif wyżej*).

Ostateczny adres kopiujemy w tym miejscu z paska adresu:

![picture alt](.images/vod-address.png "Adres programu do pobrania")



### Przykład pobierania odcinków serialu *„Jacek i Agatka”*

Poniżej znajduje się przykład uruchomienia programu w celu pobrania dwóch pierwszych odcinków serialu dla dzieci *„Jacek i Agatka”*. Do katalogu ***jacek-i-agatka*** zostaną pobrane dwa pierwsze odcinki w minimalnym dostępnym aktualnie bitrate:

![picture alt](.images/dwnldr-example.gif "Pobieranie odcinków serialu")

Efektem działań jest utworzony katalog ***jacek-i-agatka*** zawierający dwa w pełni działające oraz odtwarzające się odcinki serialu:

![picture alt](.images/downloaded-files.png "Pobrane odcinki")

#### npm package:

Program został udostępniony jako paczka npm w formie powalającej na prostą instalację. Dzięki zastosowaniu wieloplatformowego systemu uruchomieniowego możliwe jest użycie programu zarówno na systemach \*nix jak i rodzinie Windows przy prostej instalacji (patrz: *:bulb: Uruchamianie :bulb:*) z poziomu terminala.


# Linki

* [vod.tvp.pl](https://vod.tvp.pl)
* [NPMJS Repo](https://www.npmjs.com/~kwarchalowski)
* [(...)NodeJS command-line package](https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e)
* [Writing cross-platform npm scripts on Windows](https://techblog.dorogin.com/writing-cross-platform-npm-scripts-on-windows-79c510339ea6)
* [Github](https://github.com/kwarchalowski/tvpVODdownloader)
* [Issues / bugs / fixes](https://github.com/kwarchalowski/tvpVODdownloader/issues)
* [LICENSE](https://github.com/kwarchalowski/tvpVODdownloader/blob/main/LICENSE)
-------------------------------------------------------------------------------------------------