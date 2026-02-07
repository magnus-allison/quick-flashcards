'use client';

import { useState } from 'react';
import { fruits } from '@/wordlist/fruits';
import { meats } from '@/wordlist/meats';
import { dairy } from '@/wordlist/dairy';
import { clothes } from '@/wordlist/clothes';
import { colors } from '@/wordlist/colors';
import { materials } from '@/wordlist/materials';

type WordItem = {
	image: string;
	english: string;
	spanish: string;
};

type Wordlist = {
	name: string;
	words: WordItem[];
};

const wordlists: Wordlist[] = [
	{ name: 'Fruits', words: fruits },
	{ name: 'Meats', words: meats },
	{ name: 'Dairy', words: dairy },
	{ name: 'Clothes', words: clothes },
	{ name: 'Colors', words: colors },
	{ name: 'Materials', words: materials }
];

export default function Home() {
	const [selectedList, setSelectedList] = useState(0);
	const [currentCard, setCurrentCard] = useState(0);
	const [showSpanish, setShowSpanish] = useState(false);

	const currentWords = wordlists[selectedList].words;
	const card = currentWords[currentCard];

	const handleCardClick = () => {
		setShowSpanish(!showSpanish);
	};

	const nextCard = () => {
		setShowSpanish(false);
		setCurrentCard((prev) => (prev + 1) % currentWords.length);
	};

	const prevCard = () => {
		setShowSpanish(false);
		setCurrentCard((prev) => (prev - 1 + currentWords.length) % currentWords.length);
	};

	const handleListChange = (index: number) => {
		setSelectedList(index);
		setCurrentCard(0);
		setShowSpanish(false);
	};

	return (
		<div className='flex min-h-screen bg-zinc-900'>
			{/* Sidebar */}
			<aside className='w-64 bg-zinc-950 border-r border-zinc-800 p-6'>
				<h2 className='text-xl font-bold text-white mb-6'>Wordlists</h2>
				<ul className='space-y-2'>
					{wordlists.map((list, index) => (
						<li key={index}>
							<button
								onClick={() => handleListChange(index)}
								className={`w-full text-left px-4 py-2 rounded ${
									selectedList === index
										? 'bg-zinc-700 text-white'
										: 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
								}`}
							>
								{list.name}
							</button>
						</li>
					))}
				</ul>
			</aside>

			{/* Main Content */}
			<main className='flex-1 flex flex-col items-center justify-center p-8'>
				<div className='text-center mb-8'>
					<h1 className='text-2xl font-bold text-white mb-2'>{wordlists[selectedList].name}</h1>
					<p className='text-zinc-400'>
						{currentCard + 1} / {currentWords.length}
					</p>
				</div>

				{/* Flashcard */}
				<div
					onClick={handleCardClick}
					className='w-96 h-64 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-750 mb-8'
				>
					<p className='text-3xl font-semibold text-white'>
						{showSpanish ? card.spanish : card.english}
					</p>
				</div>

				{/* Navigation Buttons */}
				<div className='flex gap-4'>
					<button
						onClick={prevCard}
						className='px-6 py-3 bg-zinc-800 text-white rounded hover:bg-zinc-700 border border-zinc-700'
					>
						Previous
					</button>
					<button
						onClick={nextCard}
						className='px-6 py-3 bg-zinc-800 text-white rounded hover:bg-zinc-700 border border-zinc-700'
					>
						Next
					</button>
				</div>
			</main>
		</div>
	);
}
