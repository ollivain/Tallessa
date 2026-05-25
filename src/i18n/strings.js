export const strings = {
  fi: {
    brand: 'Tallessa',
    tagline: 'Muistot, jotka pysyvät mukana.',

    tab: {
      home: 'Koti',
      wall: 'Muistoseinä',
      letters: 'Kirjeet',
      calendar: 'Kalenteri',
      memorial: 'Paikka',
      settings: 'Asetukset',
    },

    selection: {
      title: 'Muistopaikat',
      subtitle: 'Valitse tai luo uusi.',
      create: 'Luo uusi muistopaikka',
      open: 'Avaa',
      placeSuffix: 'muistopaikka',
      empty: 'Sinulla ei ole vielä yhtään muistopaikkaa. Aloita luomalla ensimmäinen.',
    },

    creation: {
      title: 'Uusi muistopaikka',
      subtitle: 'Lisää perustiedot. Voit muokata niitä myöhemmin.',
      name: 'Nimi',
      namePlaceholder: 'Esim. Aino',
      birth: 'Syntymäaika',
      death: 'Poismenoaika',
      datePlaceholder: 'pp.kk.vvvv',
      description: 'Muutama sana',
      descriptionPlaceholder: 'Lyhyt kuvaus, esim. yhteinen tarina tai paikka.',
      save: 'Tallenna',
      cancel: 'Peruuta',
      nameRequired: 'Anna ainakin nimi.',
      portrait: 'Kuva',
      pickPortrait: 'Valitse kuva',
      changePortrait: 'Vaihda kuva',
      removePortrait: 'Poista kuva',
    },

    home: {
      welcome: 'Tervetuloa kotiin',
      memoryOfDay: 'Päivän muisto',
      memoryEmpty: 'Lisää ensimmäinen muisto, kun hetki tuntuu oikealta.',
      openMemory: 'Avaa muisto',
      dailyQuote: 'Päivän sanat',
      quickActions: 'Pikavalinnat',
      heroMemoryLine: '{name}n muistot, jotka pysyvät mukana.',
    },

    wall: {
      title: 'Muistoseinä',
      subtitle: 'Kuvia, videoita ja pieniä sanoja.',
      add: 'Lisää muisto',
      edit: 'Muokkaa muistoa',
      empty: 'Muistoseinä odottaa ensimmäistä kuvaa, videota tai lausetta.',
      pickImage: 'Valitse kuva',
      pickVideo: 'Valitse video',
      changeImage: 'Vaihda kuva',
      changeVideo: 'Vaihda video',
      removeMedia: 'Poista media',
      noMemorial: 'Luo ensin muistopaikka, johon voit liittää muistoja.',
    },

    letters: {
      title: 'Kirjeet',
      subtitle: 'Kirjeitä, joita ei tarvitse lähettää minnekään.',
      add: 'Kirjoita kirje',
      edit: 'Muokkaa kirjettä',
      empty: 'Kirjeet ovat hiljainen paikka sanoille.',
    },

    calendar: {
      title: 'Kalenteri',
      subtitle: 'Tärkeät päivät ja muistopäivät.',
      add: 'Lisää päivä',
      edit: 'Muokkaa päivää',
      empty: 'Ei merkittyjä päiviä.',
      upcoming: 'Merkityt päivät',
      prev: '‹',
      next: '›',
      weekdays: ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'],
    },

    memorial: {
      dayTitle: '{name}n päivä',
      dayTitleEn: '{name}\'s day',
      born: 'Syntyi',
      died: 'Poismeni',
      note: 'Muutama sana',
      notePlaceholder: 'Lyhyt kuvaus tai muisto...',
      candleLight: 'Sytytä kynttilä',
      candleLit: 'Kynttilä palaa',
      editTitle: 'Muokkaa muistopaikkaa',
      noDescription: 'Lisää lyhyt kuvaus muokkaamalla muistopaikkaa.',
      deleteTitle: 'Poista muistopaikka',
      deleteBody: 'Kaikki muistot, kirjeet ja tapahtumat poistetaan pysyvästi. Tätä ei voi peruuttaa.',
      deleteConfirm: 'Poista',
      deleteCancel: 'Peruuta',
    },

    delete: {
      confirm: 'Poista',
      cancel: 'Peruuta',
      memoryTitle: 'Poistetaanko muisto?',
      memoryBody: 'Tätä ei voi peruuttaa.',
      letterTitle: 'Poistetaanko kirje?',
      letterBody: 'Tätä ei voi peruuttaa.',
      eventTitle: 'Poistetaanko tapahtuma?',
      eventBody: 'Tätä ei voi peruuttaa.',
    },

    settings: {
      title: 'Asetukset',
      language: 'Kieli',
      languageFi: 'Suomi',
      languageEn: 'English',
      memorial: 'Muistopaikka',
      switchMemorial: 'Vaihda muistopaikkaa',
      deleteMemorial: 'Poista tämä muistopaikka',
      about: 'Tietoa',
      aboutBody:
        'Tallessa on rauhallinen paikka rakkaiden muistoille. Tämä on mobiiliversion varhainen luonnos.',
      version: 'Versio',
      devSection: 'Kehittäjä',
      clearAll: 'Tyhjennä kaikki data',
      clearAllConfirmTitle: 'Tyhjennä kaikki data',
      clearAllConfirmBody:
        'Poistaa kaikki muistopaikat, muistot, kirjeet ja tapahtumat pysyvästi. Tätä ei voi peruuttaa.',
      clearAllConfirm: 'Tyhjennä',
      clearAllCancel: 'Peruuta',
    },

    media: {
      permissionTitle: 'Lupa kuvakirjastoon',
      permissionBody:
        'Anna Tallessalle lupa kuvakirjastoosi puhelimesi asetuksista, jotta voit liittää kuvia ja videoita.',
      permissionOpenSettings: 'Avaa asetukset',
      permissionCancel: 'Ei nyt',
      errorTitle: 'Hetki — jokin meni vinoon',
      errorBody:
        'Median valinta ei onnistunut juuri nyt. Yritä hetken päästä uudelleen.',
      uploading: 'Lähetetään mediaa…',
      uploadErrorTitle: 'Lataus epäonnistui',
      uploadErrorNotConfigured:
        'Pilvitallennus ei ole käytössä. Aseta Supabase-asetukset .env-tiedostoon ja yritä uudelleen.',
      uploadErrorNetwork:
        'Verkkoyhteys katkesi median latauksen aikana. Tarkista yhteytesi ja yritä uudelleen.',
      uploadErrorGeneric:
        'Median lataus pilveen ei onnistunut. Muisto on tallennettu vain tälle laitteelle.',
    },

    quote:
      'Rakkaat muistot kantavat hiljaa, vaikka päivät vaihtuvat.',

    mock: {
      memorialName: 'Aino',
      memoryTitle: 'Kesäilta puutarhassa',
      memoryBody: 'Auringonkukat tuoksuivat, ja nauru kantautui keittiön ikkunasta.',
      letterTitle: 'Hyvää huomenta',
      letterBody:
        'Tänä aamuna keitin kahvit kahdelle. Asetin toisen kupin pöydälle, vaikka tiedän että et juo sitä — se tuntui silti oikealta.',
      eventName: 'Syntymäpäivä',
    },
  },

  en: {
    brand: 'Withen',
    tagline: 'Always with you.',

    tab: {
      home: 'Home',
      wall: 'Wall',
      letters: 'Letters',
      calendar: 'Calendar',
      memorial: 'Place',
      settings: 'Settings',
    },

    selection: {
      title: 'Memorial spaces',
      subtitle: 'Open one, or start a new space.',
      create: 'Create a new memorial space',
      open: 'Open',
      placeSuffix: 'memorial space',
      empty: 'You don't have any memorial spaces yet. Begin by creating one.',
    },

    creation: {
      title: 'New memorial space',
      subtitle: 'Add the basics. You can edit them later.',
      name: 'Name',
      namePlaceholder: 'E.g. Aurora',
      birth: 'Date of birth',
      death: 'Date of passing',
      datePlaceholder: 'dd.mm.yyyy',
      description: 'A few words',
      descriptionPlaceholder: 'A short note — a shared story, a place, a feeling.',
      save: 'Save',
      cancel: 'Cancel',
      nameRequired: 'Please add at least a name.',
      portrait: 'Photo',
      pickPortrait: 'Choose photo',
      changePortrait: 'Change photo',
      removePortrait: 'Remove photo',
    },

    home: {
      welcome: 'Welcome home',
      memoryOfDay: 'Memory of the day',
      memoryEmpty: 'Add your first memory when the moment feels right.',
      openMemory: 'Open memory',
      dailyQuote: 'Today's words',
      quickActions: 'Quick links',
      heroMemoryLine: '{name}\'s memories that stay with you.',
    },

    wall: {
      title: 'Memory wall',
      subtitle: 'Pictures, videos and small sentences.',
      add: 'Add memory',
      edit: 'Edit memory',
      empty: 'The memory wall is waiting for its first picture, video or sentence.',
      pickImage: 'Choose photo',
      pickVideo: 'Choose video',
      changeImage: 'Change photo',
      changeVideo: 'Change video',
      removeMedia: 'Remove media',
      noMemorial: 'Create a memorial space first so you can add memories to it.',
    },

    letters: {
      title: 'Letters',
      subtitle: 'Letters that don't need to be sent anywhere.',
      add: 'Write a letter',
      edit: 'Edit letter',
      empty: 'Letters are a quiet place for words.',
    },

    calendar: {
      title: 'Calendar',
      subtitle: 'Important days and remembrance days.',
      add: 'Add day',
      edit: 'Edit day',
      empty: 'No marked days yet.',
      upcoming: 'Marked days',
      prev: '‹',
      next: '›',
      weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    },

    memorial: {
      dayTitle: '{name}\'s day',
      dayTitleEn: '{name}\'s day',
      born: 'Born',
      died: 'Passed',
      note: 'A few words',
      notePlaceholder: 'A short description or memory...',
      candleLight: 'Light a candle',
      candleLit: 'Candle is burning',
      editTitle: 'Edit memorial space',
      noDescription: 'Add a short note by editing this memorial space.',
      deleteTitle: 'Delete memorial space',
      deleteBody: 'All memories, letters, and events will be permanently removed. This cannot be undone.',
      deleteConfirm: 'Delete',
      deleteCancel: 'Cancel',
    },

    delete: {
      confirm: 'Delete',
      cancel: 'Cancel',
      memoryTitle: 'Delete this memory?',
      memoryBody: 'This cannot be undone.',
      letterTitle: 'Delete this letter?',
      letterBody: 'This cannot be undone.',
      eventTitle: 'Delete this day?',
      eventBody: 'This cannot be undone.',
    },

    settings: {
      title: 'Settings',
      language: 'Language',
      languageFi: 'Suomi',
      languageEn: 'English',
      memorial: 'Memorial space',
      switchMemorial: 'Switch memorial',
      deleteMemorial: 'Delete this memorial space',
      about: 'About',
      aboutBody:
        'Withen is a quiet place for cherished memories. This is an early draft of the mobile version.',
      version: 'Version',
      devSection: 'Developer',
      clearAll: 'Clear all data',
      clearAllConfirmTitle: 'Clear all data',
      clearAllConfirmBody:
        'This permanently removes all memorial spaces, memories, letters, and events. This cannot be undone.',
      clearAllConfirm: 'Clear',
      clearAllCancel: 'Cancel',
    },

    media: {
      permissionTitle: 'Photo library access',
      permissionBody:
        'Withen needs permission to your photo library to attach pictures and videos. You can enable it in your phone's settings.',
      permissionOpenSettings: 'Open settings',
      permissionCancel: 'Not now',
      errorTitle: 'Something went sideways',
      errorBody:
        'Picking media didn't work just now. Please try again in a moment.',
      uploading: 'Uploading media…',
      uploadErrorTitle: 'Upload failed',
      uploadErrorNotConfigured:
        'Cloud storage isn't configured. Add your Supabase credentials to .env and try again.',
      uploadErrorNetwork:
        'The connection dropped while uploading. Check your network and try again.',
      uploadErrorGeneric:
        'Uploading the media to the cloud didn't work. The memory is saved on this device only.',
    },

    quote:
      'Cherished memories carry on quietly, even as the days change.',

    mock: {
      memorialName: 'Aurora',
      memoryTitle: 'Summer evening in the garden',
      memoryBody: 'Sunflowers were in bloom, and laughter drifted through the kitchen window.',
      letterTitle: 'Good morning',
      letterBody:
        'This morning I made coffee for two. I set the second cup on the table even though I know you won't drink it — it still felt right.',
      eventName: 'Birthday',
    },
  },
};
