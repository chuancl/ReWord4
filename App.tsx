import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { WordManager } from './components/WordManager';
import { VisualStylesSection } from './components/StyleEditor';
import { ScenariosSection, EnginesSection, InteractionSection, AnkiSection, PageWidgetSection, GeneralSection } from './components/Settings';
import { PreviewSection } from './components/settings/PreviewSection'; 
import { WordDetail } from './components/WordDetail';
import { Loader2 } from 'lucide-react';
import { AppView, SettingSectionId, Scenario, WordEntry, PageWidgetConfig, WordInteractionConfig, TranslationEngine, AnkiConfig, AutoTranslateConfig, StyleConfig, WordCategory, OriginalTextConfig, DictionaryEngine, WordTab } from './types';
import { DEFAULT_STYLES, DEFAULT_ORIGINAL_TEXT_CONFIG, DEFAULT_WORD_INTERACTION, DEFAULT_PAGE_WIDGET, INITIAL_ENGINES, DEFAULT_ANKI_CONFIG, DEFAULT_AUTO_TRANSLATE, INITIAL_SCENARIOS, INITIAL_DICTIONARIES } from './constants';
import { entriesStorage, scenariosStorage, pageWidgetConfigStorage, autoTranslateConfigStorage, enginesStorage, ankiConfigStorage, seedInitialData, stylesStorage, originalTextConfigStorage, interactionConfigStorage, dictionariesStorage } from './utils/storage';
import { preloadVoices } from './utils/audio';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeSettingSection, setActiveSettingSection] = useState<SettingSectionId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data States
  const [entries, setEntries] = useState<WordEntry[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [engines, setEngines] = useState<TranslationEngine[]>([]);
  const [dictionaries, setDictionaries] = useState<DictionaryEngine[]>([]);
  
  // Config States
  const [styles, setStyles] = useState<Record<WordCategory, StyleConfig>>(DEFAULT_STYLES);
  const [originalTextConfig, setOriginalTextConfig] = useState<OriginalTextConfig>(DEFAULT_ORIGINAL_TEXT_CONFIG);
  const [interactionConfig, setInteractionConfig] = useState<WordInteractionConfig>(DEFAULT_WORD_INTERACTION);
  const [pageWidgetConfig, setPageWidgetConfig] = useState<PageWidgetConfig>(DEFAULT_PAGE_WIDGET);
  const [ankiConfig, setAnkiConfig] = useState<AnkiConfig>(DEFAULT_ANKI_CONFIG);
  const [autoTranslateConfig, setAutoTranslateConfig] = useState<AutoTranslateConfig>(DEFAULT_AUTO_TRANSLATE);

  // Navigation Logic for deep links in Preview
  const [detailWord, setDetailWord] = useState<string>('');
  const [managerSearchQuery, setManagerSearchQuery] = useState<string>('');
  const [managerTab, setManagerTab] = useState<WordTab>('all');

  useEffect(() => {
    const loadData = async () => {
      await seedInitialData();
      preloadVoices();

      const [sEntries, sScenarios, sStyles, sOrigText, sInteraction, sWidget, sEngines, sAnki, sAuto, sDicts] = await Promise.all([
        entriesStorage.getValue(),
        scenariosStorage.getValue(),
        stylesStorage.getValue(),
        originalTextConfigStorage.getValue(),
        interactionConfigStorage.getValue(),
        pageWidgetConfigStorage.getValue(),
        enginesStorage.getValue(),
        ankiConfigStorage.getValue(),
        autoTranslateConfigStorage.getValue(),
        dictionariesStorage.getValue()
      ]);

      if (sEntries) setEntries(sEntries);
      if (sScenarios) setScenarios(sScenarios);
      if (sStyles) setStyles(sStyles);
      if (sOrigText) setOriginalTextConfig(sOrigText);
      if (sInteraction) setInteractionConfig(sInteraction);
      if (sWidget) setPageWidgetConfig(sWidget);
      if (sEngines) setEngines(sEngines);
      if (sAnki) setAnkiConfig(sAnki);
      if (sAuto) setAutoTranslateConfig(sAuto);
      if (sDicts) setDictionaries(sDicts);

      // --- URL Parameter Handling (Routing) ---
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') as AppView;
      const wordParam = params.get('word');
      const tabParam = params.get('tab') as WordTab;
      const searchParam = params.get('search');

      if (viewParam === 'word-detail' && wordParam) {
          setDetailWord(wordParam);
          setCurrentView('word-detail');
      } else if (viewParam === 'words') {
          setCurrentView('words');
          if (tabParam) setManagerTab(tabParam);
          if (searchParam) setManagerSearchQuery(searchParam);
      } else if (viewParam === 'settings') {
          setCurrentView('settings');
          const sectionParam = params.get('section') as SettingSectionId;
          if (sectionParam) {
              setTimeout(() => handleSettingScroll(sectionParam), 100);
          }
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Sync state back to storage
  useEffect(() => { if (!isLoading) entriesStorage.setValue(entries); }, [entries, isLoading]);
  useEffect(() => { if (!isLoading) scenariosStorage.setValue(scenarios); }, [scenarios, isLoading]);
  useEffect(() => { if (!isLoading) stylesStorage.setValue(styles); }, [styles, isLoading]);
  useEffect(() => { if (!isLoading) originalTextConfigStorage.setValue(originalTextConfig); }, [originalTextConfig, isLoading]);
  useEffect(() => { if (!isLoading) interactionConfigStorage.setValue(interactionConfig); }, [interactionConfig, isLoading]);
  useEffect(() => { if (!isLoading) pageWidgetConfigStorage.setValue(pageWidgetConfig); }, [pageWidgetConfig, isLoading]);
  useEffect(() => { if (!isLoading) enginesStorage.setValue(engines); }, [engines, isLoading]);
  useEffect(() => { if (!isLoading) ankiConfigStorage.setValue(ankiConfig); }, [ankiConfig, isLoading]);
  useEffect(() => { if (!isLoading) autoTranslateConfigStorage.setValue(autoTranslateConfig); }, [autoTranslateConfig, isLoading]);

  const handleSettingScroll = (id: SettingSectionId) => {
    setActiveSettingSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShowDetail = (word: string) => {
      setDetailWord(word);
      setCurrentView('word-detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenWords = (word: string) => {
      setManagerSearchQuery(word);
      setManagerTab('all');
      setCurrentView('words');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">正在加载配置信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(v) => {
            setCurrentView(v);
            if (v === 'words') { setManagerSearchQuery(''); setManagerTab('all'); }
        }} 
        onSettingScroll={handleSettingScroll}
        activeSettingSection={activeSettingSection}
      />

      <main className="flex-1 ml-64 p-8 max-w-7xl mx-auto w-full">
        {currentView === 'dashboard' && <Dashboard entries={entries} scenarios={scenarios} />}
        
        {currentView === 'words' && (
          <WordManager 
            scenarios={scenarios} 
            entries={entries} 
            setEntries={setEntries} 
            ttsSpeed={autoTranslateConfig.ttsSpeed}
            initialTab={managerTab}
            initialSearchQuery={managerSearchQuery}
          />
        )}

        {currentView === 'word-detail' && (
          <WordDetail 
            word={detailWord} 
            onBack={() => setCurrentView('words')} 
          />
        )}

        {currentView === 'settings' && (
          <div className="space-y-12">
            <div id="general"><GeneralSection config={autoTranslateConfig} setConfig={setAutoTranslateConfig} /></div>
            <div id="visual-styles">
              <VisualStylesSection 
                styles={styles} 
                onStylesChange={setStyles}
                originalTextConfig={originalTextConfig}
                onOriginalTextConfigChange={setOriginalTextConfig}
              />
            </div>
            <div id="scenarios"><ScenariosSection scenarios={scenarios} setScenarios={setScenarios} /></div>
            <div id="word-bubble">
              <InteractionSection 
                config={interactionConfig} 
                setConfig={setInteractionConfig} 
                onShowDetail={handleShowDetail}
                onOpenWords={handleOpenWords}
              />
            </div>
            <div id="page-widget"><PageWidgetSection widget={pageWidgetConfig} setWidget={setPageWidgetConfig} /></div>
            <div id="engines"><EnginesSection engines={engines} setEngines={setEngines} dictionaries={dictionaries} /></div>
            <div id="preview">
               <PreviewSection 
                 engines={engines} 
                 entries={entries} 
                 styles={styles} 
                 originalTextConfig={originalTextConfig} 
                 autoTranslateConfig={autoTranslateConfig}
               />
            </div>
            <div id="anki"><AnkiSection config={ankiConfig} setConfig={setAnkiConfig} entries={entries} setEntries={setEntries} /></div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;