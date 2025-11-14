class BroadwayRanker {
    constructor() {
        this.shows = [];
        this.currentBracket = [];
        this.winners = [];
        this.finalRankings = [];
        this.topTen = [];
        this.roundWinners = {};
        this.currentPhase = 'comparison';
        this.champion = null;
        this.challengers = [];
        this.rankingPhase = 'first'; // first, second, third
        this.roundNumber = 1;
        this.totalComparisons = 0;
        this.currentComparison = 0;
        this.kothTotalComparisons = 0;
        this.kothComparisonsDone = 0;

        this.transitionTimeout = null;
        this.isTransitioning = false;

        this.initializeApp();
    }

    async initializeApp() {
        await this.loadShows();
        this.setupEventListeners();
        this.startGame();
    }

    async loadShows() {
        try {
            const response = await fetch('broadway_shows.json');
            this.shows = await response.json();
            console.log('Loaded shows:', this.shows.length);
        } catch (error) {
            console.error('Error loading shows:', error);
            // Fallback to sample data if JSON file is not available
            this.shows = [
                { 
                    id: 1, 
                    title: "The Outsiders", 
                    image: "https://imaging.broadway.com/images/poster-178275/w308/127494-7.jpg", 
                    description: "A musical adaptation of S. E. Hinton's novel about rival teen gangs, brotherhood, and the struggle to find hope and identity across social divides." 
                },
                { 
                    id: 2, 
                    title: "Heathers The Musical", 
                    image: "https://imaging.broadway.com/images/poster-178275/w308/136087-3.jpg", 
                    description: "A dark, satirical rock musical based on the cult film, following a teenage girl who falls in with the school's cruel queen bees and a dangerous outsider." 
                },
                { 
                    id: 3, 
                    title: "Hadestown", 
                    image: "https://imaging.broadway.com/images/poster-178275/w308/133959-3.jpg", 
                    description: "A folk- and jazz-infused retelling of the Orpheus and Eurydice myth that contrasts a lush world above with an industrial underworld ruled by Hades." 
                }
            ];
        }
    }

    setupEventListeners() {
        // Comparison phase event listeners
        document.getElementById('showA').addEventListener('click', () => this.handleSelection('A'));
        document.getElementById('showB').addEventListener('click', () => this.handleSelection('B'));
        
        // King of the Hill phase event listeners - BOTH cards are clickable
        document.getElementById('championShow').addEventListener('click', () => this.handleKingOfTheHillSelection('champion'));
        document.getElementById('challengerShow').addEventListener('click', () => this.handleKingOfTheHillSelection('challenger'));
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
    }

    startGame() {
        // Start with all shows shuffled for round 1
        this.currentBracket = [...this.shows];
        this.shuffleArray(this.currentBracket);
        this.winners = [];
        this.roundNumber = 1;
        this.rankingPhase = 'first';
        this.roundWinners = {};
        this.currentComparison = 0;
        
        this.setupNewRound();
        this.updateComparisonPair();
        this.updateProgress();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    setupNewRound() {
        // Reset progress tracking for new round
        this.currentComparison = 0;
        this.totalComparisons = Math.floor(this.currentBracket.length / 2);
        
        // Reset progress bar
        this.resetProgressBar();
        
        console.log(`Starting Round ${this.roundNumber} with ${this.currentBracket.length} shows, ${this.totalComparisons} comparisons`);
    }

    resetProgressBar() {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    }

    updateComparisonPair() {
        // Check if we need to advance to next round
        if (this.currentBracket.length < 2 && this.winners.length > 0) {
            this.advanceToNextRound();
            return;
        }

        // Check if we're done with bracket phase (down to 10 shows or fewer)
        const totalRemaining = this.currentBracket.length + this.winners.length;
        if (totalRemaining <= 10) {
            this.completeBracketPhase();
            return;
        }

        // Get next pair
        if (this.currentBracket.length >= 2) {
            const showA = this.currentBracket[0];
            const showB = this.currentBracket[1];

            this.updateShowCard('showA', showA);
            this.updateShowCard('showB', showB);
        }
        
        this.updateProgress();
    }

    handleSelection(selected) {
        const selectedShow = selected === 'A' ? this.currentBracket[0] : this.currentBracket[1];
        const eliminatedShow = selected === 'A' ? this.currentBracket[1] : this.currentBracket[0];

        // Remove both shows from current bracket
        this.currentBracket.splice(0, 2);
        
        // Add winner to winners array
        this.winners.push(selectedShow);

        // Store round winner for final display
        if (!this.roundWinners[this.roundNumber]) {
            this.roundWinners[this.roundNumber] = [];
        }
        this.roundWinners[this.roundNumber].push(selectedShow);

        // Update progress
        this.currentComparison++;
        this.updateProgress();

        this.updateComparisonPair();
    }

    advanceToNextRound() {
        this.roundNumber++;
        
        // Winners become the new bracket, shuffle them
        this.currentBracket = [...this.winners];
        this.shuffleArray(this.currentBracket);
        this.winners = [];
        
        console.log(`Advancing to Round ${this.roundNumber} with ${this.currentBracket.length} shows`);
        
        // Check if this should be the last round before King of the Hill
        const totalRemaining = this.currentBracket.length;
        if (totalRemaining <= 10) {
            console.log('Transitioning to King of the Hill after round', this.roundNumber);
            
            // Show King of the Hill transition with longer duration
            this.showTransition(
                '🏆 King of the Hill! 🏆',
                `Time to determine the Top 3 rankings from your ${totalRemaining} favorite shows!\n\nClick the show you prefer. The champion stays until defeated!`,
                4000
            );
            
            setTimeout(() => {
                this.completeBracketPhase();
            }, 4100);
        } else {
            // Show regular round transition
            this.showTransition(
                `Round ${this.roundNumber}`,
                `Get ready for the next bracket! ${this.currentBracket.length} shows competing...`,
                2500
            );
            
            setTimeout(() => {
                this.setupNewRound();
                this.updateComparisonPair();
            }, 2600);
        }
    }

    completeBracketPhase() {
        // Combine any remaining shows with winners to get top 10 or fewer
        this.topTen = [...this.currentBracket, ...this.winners];
        this.shuffleArray(this.topTen);
        
        console.log('Bracket phase complete. Top shows:', this.topTen.map(s => s.title));
        
        // Transition directly to King of the Hill setup (no additional transition)
        this.transitionToKingOfTheHill();
    }

    transitionToKingOfTheHill() {
        this.currentPhase = 'kingOfTheHill';
        this.challengers = [...this.topTen];
        this.shuffleArray(this.challengers);
        
        // Set first champion
        this.champion = this.challengers.pop();
        
        // Initialize King of the Hill progress tracking
        this.kothTotalComparisons = this.topTen.length - 1;
        this.kothComparisonsDone = 0;
        
        console.log(`King of the Hill: ${this.topTen.length} shows, ${this.kothTotalComparisons} comparisons needed`);
        
        // Update display after transition completes
        setTimeout(() => {
            this.updateKingOfTheHillDisplay();
            this.switchPhase('kingOfTheHillPhase');
            this.updateKingOfTheHillProgress();
        }, 100);
    }

    handleKingOfTheHillSelection(selected) {
        if (selected === 'champion') {
            // Champion wins - challenger is ELIMINATED from current ranking contention
            const eliminatedChallenger = this.challengers.shift();
            console.log(`Eliminated from ${this.getCurrentRankingPhaseText()} contention:`, eliminatedChallenger.title);
            
            // Progress: one challenger eliminated
            this.kothComparisonsDone++;
            
        } else {
            // Challenger wins - becomes new champion
            const eliminatedChampion = this.champion;
            this.champion = this.challengers.shift();
            console.log(`New champion for ${this.getCurrentRankingPhaseText()}:`, this.champion.title);
            console.log(`Eliminated from ${this.getCurrentRankingPhaseText()} contention:`, eliminatedChampion.title);
            
            // Progress: one comparison completed (champion eliminated)
            this.kothComparisonsDone++;
        }

        this.updateKingOfTheHillProgress();
        this.updateKingOfTheHillDisplay();
    }

    updateKingOfTheHillProgress() {
        const progress = (this.kothComparisonsDone / this.kothTotalComparisons) * 100;
        
        document.getElementById('progressBar').style.width = `${progress}%`;
        
        // Update progress text
        document.getElementById('progressCount').textContent = 
            `${this.kothComparisonsDone}/${this.kothTotalComparisons} comparisons`;
    }

    updateKingOfTheHillDisplay() {
        this.updateShowCard('championShow', this.champion);
        
        if (this.challengers.length > 0) {
            this.updateShowCard('challengerShow', this.challengers[0]);
            this.updateKingOfTheHillProgress();
        } else {
            // No more challengers - current ranking phase is complete
            console.log(`King of the Hill phase complete for ${this.getCurrentRankingPhaseText()}`);
            this.completeRankingPhase();
            return;
        }
    }

    getCurrentRankingPhaseText() {
        switch(this.rankingPhase) {
            case 'first': return '1st place';
            case 'second': return '2nd place'; 
            case 'third': return '3rd place';
            default: return 'current place';
        }
    }

    completeRankingPhase() {
        if (this.rankingPhase === 'first') {
            // We have our 1st place winner
            this.finalRankings.push(this.champion);
            console.log('1st Place:', this.champion.title);
            
            // Show 1st place celebration with longer duration
            this.showTransition(
                '🥇 1st Place Determined!',
                `${this.champion.title} is your champion!\n\nNow let's find 2nd place...`,
                3500
            );
            
            // Remove 1st place from topTen and setup for 2nd place
            this.topTen = this.topTen.filter(show => show.id !== this.champion.id);
            this.rankingPhase = 'second';
            
            setTimeout(() => {
                this.setupNextRankingPhase();
            }, 3600);
            
        } else if (this.rankingPhase === 'second') {
            // We have our 2nd place winner
            this.finalRankings.push(this.champion);
            console.log('2nd Place:', this.champion.title);
            
            // Show 2nd place celebration with longer duration
            this.showTransition(
                '🥈 2nd Place Determined!',
                `${this.champion.title} takes second place!\n\nNow let's find 3rd place...`,
                3500
            );
            
            // Remove 2nd place from topTen and setup for 3rd place
            this.topTen = this.topTen.filter(show => show.id !== this.champion.id);
            this.rankingPhase = 'third';
            
            setTimeout(() => {
                this.setupNextRankingPhase();
            }, 3600);
            
        } else if (this.rankingPhase === 'third') {
            // We have our 3rd place winner
            this.finalRankings.push(this.champion);
            console.log('3rd Place:', this.champion.title);
            
            // Show 3rd place celebration and transition to results
            this.showTransition(
                '🥉 3rd Place Determined!',
                `${this.champion.title} takes third place!\n\nHere are your final rankings!`,
                3500
            );
            
            // Show final results after a delay
            setTimeout(() => {
                this.showFinalResults();
            }, 3600);
        }
    }

    setupNextRankingPhase() {
        // Reset for next ranking phase with remaining shows
        this.challengers = [...this.topTen];
        this.shuffleArray(this.challengers);
        this.champion = this.challengers.pop();
        
        // Reset progress tracking for new ranking phase
        this.kothTotalComparisons = this.topTen.length - 1;
        this.kothComparisonsDone = 0;
        
        console.log(`Next ranking phase: ${this.topTen.length} shows, ${this.kothTotalComparisons} comparisons needed`);
        
        // Update display immediately (no additional transition)
        this.updateKingOfTheHillDisplay();
        
        // Update instructions based on current ranking phase
        const instructions = document.querySelector('#kingOfTheHillPhase .instructions h2');
        if (instructions) {
            if (this.rankingPhase === 'second') {
                instructions.textContent = 'Finding 2nd Place';
                document.querySelector('#kingOfTheHillPhase .instructions p').textContent = 'Click which show should be 2nd place.';
            } else if (this.rankingPhase === 'third') {
                instructions.textContent = 'Finding 3rd Place';
                document.querySelector('#kingOfTheHillPhase .instructions p').textContent = 'Click which show should be 3rd place.';
            }
        }
    }

    showTransition(title, subtitle, delay = 3000) {
        const overlay = document.getElementById('transitionOverlay');
        const titleElement = document.getElementById('transitionTitle');
        const subtitleElement = document.getElementById('transitionSubtitle');
        
        console.log('Showing transition:', title);
        
        // Clear any existing timeout
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
        }
        
        // Set message content with line break support
        titleElement.textContent = title;
        subtitleElement.innerHTML = subtitle.replace(/\n/g, '<br>');
        
        // Show overlay
        overlay.classList.remove('hidden');
        this.isTransitioning = true;
        
        // Force a reflow to ensure the display change is processed
        void overlay.offsetWidth;
        
        // Auto-hide after delay
        this.transitionTimeout = setTimeout(() => {
            console.log('Hiding transition');
            overlay.classList.add('hidden');
            this.isTransitioning = false;
        }, delay);
    }

    updateShowCard(cardId, show) {
        const card = document.getElementById(cardId);
        if (!card) {
            console.error('Card not found:', cardId);
            return;
        }
        
        card.dataset.showId = show.id;
        
        // Update poster image
        const poster = card.querySelector('.poster');
        if (poster) {
            poster.src = show.image || 'https://via.placeholder.com/400x600/667eea/ffffff?text=No+Image';
            poster.alt = show.title;
        }
        
        // Update title
        const titleElement = card.querySelector('.show-title');
        if (titleElement) {
            titleElement.textContent = show.title;
        }
        
        // Update description in overlay
        const descriptionElement = card.querySelector('.show-description');
        if (descriptionElement) {
            descriptionElement.textContent = show.description || 'No description available.';
        }
    }

    switchPhase(phaseId) {
        // Hide all phases
        document.querySelectorAll('.phase').forEach(phase => {
            phase.classList.remove('active');
        });
        
        // Show target phase
        document.getElementById(phaseId).classList.add('active');
    }

    updateProgress() {
        const totalShows = this.shows.length;
        
        if (this.currentPhase === 'comparison') {
            const totalRemaining = this.currentBracket.length + this.winners.length;
            const showsProcessed = totalShows - totalRemaining;
            
            // Calculate progress within current round
            let roundProgress = 0;
            if (this.totalComparisons > 0) {
                roundProgress = (this.currentComparison / this.totalComparisons) * 100;
            }
            
            document.getElementById('progressBar').style.width = `${roundProgress}%`;
            document.getElementById('progressText').textContent = `Round ${this.roundNumber}`;
            document.getElementById('progressCount').textContent = `${this.currentComparison}/${this.totalComparisons} comparisons`;
            
        } else if (this.currentPhase === 'kingOfTheHill') {
            let progressText = '';
            
            if (this.rankingPhase === 'first') {
                progressText = 'King of the Hill - Finding 1st Place';
            } else if (this.rankingPhase === 'second') {
                progressText = 'Finding 2nd Place';
            } else if (this.rankingPhase === 'third') {
                progressText = 'Finding 3rd Place';
            }
            
            document.getElementById('progressBar').style.width = `${(this.kothComparisonsDone / this.kothTotalComparisons) * 100}%`;
            document.getElementById('progressText').textContent = progressText;
            document.getElementById('progressCount').textContent = `${this.kothComparisonsDone}/${this.kothTotalComparisons} comparisons`;
        }
    }

    showFinalResults() {
        this.switchPhase('resultsPhase');
        
        const rankingsContainer = document.getElementById('finalRankings');
        if (!rankingsContainer) return;
        
        rankingsContainer.innerHTML = '';
        
        // Display Top 3 Rankings
        const topThreeSection = document.createElement('div');
        topThreeSection.className = 'results-section';
        topThreeSection.innerHTML = '<h3>🏆 Top 3 Rankings</h3>';
        
        const topThreeGrid = document.createElement('div');
        topThreeGrid.className = 'winners-grid';
        
        this.finalRankings.forEach((show, index) => {
            const rankItem = document.createElement('div');
            rankItem.className = 'winner-item';
            
            rankItem.innerHTML = `
                <div class="rank-badge">${index + 1}</div>
                <img src="${show.image || 'https://via.placeholder.com/60x90/667eea/ffffff?text=No+Image'}" alt="${show.title}" class="winner-poster">
                <span class="winner-title">${show.title}</span>
            `;
            
            topThreeGrid.appendChild(rankItem);
        });
        
        topThreeSection.appendChild(topThreeGrid);
        rankingsContainer.appendChild(topThreeSection);
        
        // Display Remaining Top 10 (4th-10th place, arbitrary order)
        const remainingTopTen = this.topTen.filter(show => 
            !this.finalRankings.some(ranked => ranked.id === show.id)
        );
        
        if (remainingTopTen.length > 0) {
            const topTenSection = document.createElement('div');
            topTenSection.className = 'results-section';
            topTenSection.innerHTML = '<h3>🎭 Top 10 Shows</h3>';
            
            const topTenGrid = document.createElement('div');
            topTenGrid.className = 'winners-grid';
            
            remainingTopTen.forEach((show, index) => {
                const rankItem = document.createElement('div');
                rankItem.className = 'winner-item';
                
                rankItem.innerHTML = `
                    <div class="rank-badge">${index + 4}</div>
                    <img src="${show.image || 'https://via.placeholder.com/60x90/667eea/ffffff?text=No+Image'}" alt="${show.title}" class="winner-poster">
                    <span class="winner-title">${show.title}</span>
                `;
                
                topTenGrid.appendChild(rankItem);
            });
            
            topTenSection.appendChild(topTenGrid);
            rankingsContainer.appendChild(topTenSection);
        }
        
        // Display Eliminated Shows by Round (excluding Top 10)
        const eliminatedSection = document.createElement('div');
        eliminatedSection.className = 'results-section';
        eliminatedSection.innerHTML = '<h3>📊 Elimination History</h3>';
        
        // Get all shows that made it to Top 10
        const topTenShows = [...this.finalRankings, ...this.topTen];
        
        // Create scrollable container for elimination history
        const scrollableContainer = document.createElement('div');
        scrollableContainer.className = 'elimination-scroll-container';
        
        Object.keys(this.roundWinners).sort((a, b) => b - a).forEach(roundNum => {
            // Filter out shows that made it to Top 10 (they weren't truly eliminated in earlier rounds)
            const eliminatedInRound = this.roundWinners[roundNum].filter(show => 
                !topTenShows.some(topShow => topShow.id === show.id)
            );
            
            // Only show rounds that actually had eliminations
            if (eliminatedInRound.length > 0) {
                const roundSection = document.createElement('div');
                roundSection.className = 'round-section';
                roundSection.innerHTML = `<h4>Round ${roundNum} Eliminations</h4>`;
                
                const eliminatedGrid = document.createElement('div');
                eliminatedGrid.className = 'winners-grid';
                
                eliminatedInRound.forEach(show => {
                    const eliminatedItem = document.createElement('div');
                    eliminatedItem.className = 'winner-item';
                    
                    eliminatedItem.innerHTML = `
                        <img src="${show.image || 'https://via.placeholder.com/60x90/667eea/ffffff?text=No+Image'}" alt="${show.title}" class="winner-poster">
                        <span class="winner-title">${show.title}</span>
                    `;
                    
                    eliminatedGrid.appendChild(eliminatedItem);
                });
                
                roundSection.appendChild(eliminatedGrid);
                scrollableContainer.appendChild(roundSection);
            }
        });
        
        eliminatedSection.appendChild(scrollableContainer);
        rankingsContainer.appendChild(eliminatedSection);
        
        document.getElementById('progressText').textContent = 'Ranking Complete!';
        document.getElementById('progressCount').textContent = `${this.shows.length}/${this.shows.length}`;
        document.getElementById('progressBar').style.width = '100%';
    }

    restartGame() {
        this.currentBracket = [];
        this.winners = [];
        this.finalRankings = [];
        this.topTen = [];
        this.roundWinners = {};
        this.currentPhase = 'comparison';
        this.champion = null;
        this.challengers = [];
        this.roundNumber = 1;
        this.rankingPhase = 'first';
        this.currentComparison = 0;
        this.totalComparisons = 0;
        this.kothTotalComparisons = 0;
        this.kothComparisonsDone = 0;
        
        this.startGame();
        this.switchPhase('comparisonPhase');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BroadwayRanker();
});
