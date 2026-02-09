'use client';

import { useState, useEffect, useCallback } from 'react';

type WordItem = Record<string, string>;

type Wordlist = {
	name: string;
	words: WordItem[];
};

type LanguageData = {
	flag: string;
	translationKey: string;
	wordlists: Wordlist[];
};

const languageFlags: Record<string, string> = {
	es: '🇪🇸',
	de: '🇩🇪',
	fr: '🇫🇷'
};

function loadAllLanguages(): Record<string, LanguageData> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const ctx = (require as any).context('../wordlist', true, /^\.\/[^/]+\/(?!index)[^/]+\.ts$/);
	const languages: Record<string, LanguageData> = {};

	for (const key of ctx.keys() as string[]) {
		const [, lang, file] = key.match(/^\.\/([^/]+)\/([^/]+)\.ts$/) ?? [];
		if (!lang || !file) continue;

		const mod = ctx(key);
		const words: WordItem[] = mod[Object.keys(mod)[0]];
		let name = file.charAt(0).toUpperCase() + file.slice(1);

		if (name.includes('_')) {
			name = name
				.split('_')
				.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
				.join(' ');
		}

		if (!languages[lang]) {
			const translationKey =
				Object.keys(words[0] ?? {}).find((k) => k !== 'image' && k !== 'english') ?? '';
			languages[lang] = {
				flag: languageFlags[lang] ?? '🏳️',
				translationKey,
				wordlists: []
			};
		}

		languages[lang].wordlists.push({ name, words });
	}

	for (const lang of Object.values(languages)) {
		lang.wordlists.sort((a, b) => a.name.localeCompare(b.name));
	}

	return languages;
}

const allLanguages = loadAllLanguages();
const languageCodes = Object.keys(allLanguages).sort();

export default function Home() {
	const [language, setLanguage] = useState(languageCodes[0]);
	const [selectedList, setSelectedList] = useState(0);
	const [currentCard, setCurrentCard] = useState(0);
	const [showTranslation, setShowTranslation] = useState(false);
	const [shuffledLists, setShuffledLists] = useState<Record<string, Wordlist[]>>({});

	const langData = allLanguages[language];
	const wordlists = shuffledLists[language] ?? langData?.wordlists ?? [];
	const currentList = wordlists[selectedList];
	const currentWords = currentList?.words ?? [];
	const hasWords = currentWords.length > 0;
	const card = hasWords ? currentWords[currentCard] : null;
	const translationKey = langData?.translationKey ?? '';

	const handleCardClick = () => {
		if (!hasWords) return;
		setShowTranslation((prev) => !prev);
	};

	const handleKeyAction = useCallback(
		(key: string, code: string, preventDefault: () => void) => {
			if (!hasWords) return;
			if (code === 'Space' || key === ' ') {
				preventDefault();
				setShowTranslation((prev) => !prev);
				return;
			}
			if (code === 'ArrowRight' || key === 'ArrowRight') {
				preventDefault();
				setShowTranslation(false);
				setCurrentCard((prev) => (prev + 1) % currentWords.length);
				return;
			}
			if (code === 'ArrowLeft' || key === 'ArrowLeft') {
				preventDefault();
				setShowTranslation(false);
				setCurrentCard((prev) => (prev - 1 + currentWords.length) % currentWords.length);
			}
		},
		[hasWords, currentWords.length]
	);

	const nextCard = () => {
		if (!hasWords) return;
		setShowTranslation(false);
		setCurrentCard((prev) => (prev + 1) % currentWords.length);
	};

	const prevCard = () => {
		if (!hasWords) return;
		setShowTranslation(false);
		setCurrentCard((prev) => (prev - 1 + currentWords.length) % currentWords.length);
	};

	const handleListChange = (index: number) => {
		setSelectedList(index);
		setCurrentCard(0);
		setShowTranslation(false);
	};

	const handleLanguageChange = (nextLanguage: string) => {
		setLanguage(nextLanguage);
		setSelectedList(0);
		setCurrentCard(0);
		setShowTranslation(false);
	};

	const shuffleCards = () => {
		if (!currentList) return;
		const shuffled = [...currentWords].sort(() => Math.random() - 0.5);
		setShuffledLists((prev) => ({
			...prev,
			[language]: wordlists.map((list, i) => (i === selectedList ? { ...list, words: shuffled } : list))
		}));
		setCurrentCard(0);
		setShowTranslation(false);
	};

	useEffect(() => {
		const handleKeyPress = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			const tagName = target?.tagName?.toLowerCase();
			if (
				target?.isContentEditable ||
				tagName === 'input' ||
				tagName === 'textarea' ||
				tagName === 'select'
			) {
				return;
			}
			handleKeyAction(e.key, e.code, () => e.preventDefault());
		};

		document.addEventListener('keydown', handleKeyPress);
		return () => document.removeEventListener('keydown', handleKeyPress);
	}, [handleKeyAction]);

	return (
		<div className='flex min-h-screen bg-[#0a0a0a]'>
			{/* Sidebar */}
			<aside className='w-60 bg-[#111] border-r border-[#333] p-5 flex flex-col'>
				<div>
					<div className='flex items-center justify-between mb-4'>
						<span className='text-[11px] uppercase tracking-[2px] text-[#666]'>Wordlists</span>
						<button
							onClick={shuffleCards}
							className='p-1 text-[#555] hover:text-[#e0e0e0] disabled:opacity-30'
							disabled={!hasWords}
							aria-label='Shuffle cards'
							title='Shuffle cards'
						>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								width='14'
								height='14'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							>
								<path d='M16 3h5v5' />
								<path d='M4 20 21 3' />
								<path d='M21 16v5h-5' />
								<path d='M15 15 21 21' />
								<path d='M4 4l5 5' />
							</svg>
						</button>
					</div>
					<ul className='space-y-0.5'>
						{wordlists.map((list, index) => (
							<li key={index}>
								<button
									onClick={() => handleListChange(index)}
									className={`w-full text-left px-3 py-2 text-[13px] ${
										selectedList === index
											? 'bg-[#1a1a1a] text-[#e0e0e0] border-l-2 border-[#555]'
											: 'text-[#888] hover:bg-[#151515] hover:text-[#e0e0e0] border-l-2 border-transparent'
									}`}
								>
									{list.name}
								</button>
							</li>
						))}
					</ul>
				</div>

				<div className='mt-auto pt-5 border-t border-[#222]'>
					<span className='text-[11px] uppercase tracking-[2px] text-[#666]'>Language</span>
					<div className='mt-3 flex gap-2 flex-wrap'>
						{languageCodes.map((code) => (
							<button
								key={code}
								onClick={() => handleLanguageChange(code)}
								className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 border text-[13px] ${
									language === code
										? 'bg-[#1a1a1a] text-[#e0e0e0] border-[#555]'
										: 'bg-[#0d0d0d] text-[#888] border-[#333] hover:bg-[#151515] hover:text-[#e0e0e0]'
								}`}
								aria-pressed={language === code}
							>
								<span aria-hidden='true'>{allLanguages[code].flag}</span>
								<span>{code.toUpperCase()}</span>
							</button>
						))}
					</div>
				</div>
			</aside>

			{/* Main Content */}
			<main className='flex-1 flex flex-col items-center justify-center p-8'>
				<div className='text-center mb-8'>
					<h1 className='text-[15px] text-[#e0e0e0] mb-1'>{currentList?.name ?? 'Loading...'}</h1>
					<p className='text-[#555] text-[12px]'>
						{hasWords ? currentCard + 1 : 0} / {currentWords.length}
					</p>
				</div>

				{/* Flashcard */}
				<div
					tabIndex={-1}
					onClick={handleCardClick}
					className='relative w-102 h-64 bg-[#111] border border-[#333] flex items-center justify-center cursor-pointer hover:bg-[#151515] hover:border-[#444] mb-8 select-none outline-none'
				>
					{showTranslation && (
						<div className='absolute top-4 right-4 w-2.5 h-2.5 bg-[#3ddc84] rounded-full shadow-[0_0_0_2px_#111]' />
					)}
					<p className='text-2xl text-[#e0e0e0]'>
						{card ? (showTranslation ? card[translationKey] : card.english) : '...'}
					</p>
				</div>

				{/* Navigation Buttons */}
				<div className='flex gap-3'>
					<button
						onClick={prevCard}
						tabIndex={-1}
						className='px-4 py-2.5 bg-[#1a1a1a] text-[#e0e0e0] border border-[#333] hover:bg-[#252525] hover:border-[#444] disabled:opacity-30 text-[13px]'
						disabled={!hasWords}
					>
						Previous
					</button>
					<button
						onClick={nextCard}
						tabIndex={-1}
						className='px-4 py-2.5 bg-[#1a1a1a] text-[#e0e0e0] border border-[#333] hover:bg-[#252525] hover:border-[#444] disabled:opacity-30 text-[13px]'
						disabled={!hasWords}
					>
						Next
					</button>
				</div>
			</main>
		</div>
	);
}
