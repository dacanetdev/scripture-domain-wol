# Scripture Dominion: War of Light

An interactive scripture battle game for LDS youth groups. Players use their phones to participate in real-time team challenges over 12 rounds, applying D&C scriptures to real-life scenarios.

## 🎮 Game Overview

**Scripture Dominion: War of Light** is a mobile-first web application designed to engage LDS youth in scripture study through competitive gameplay. Teams battle through 12 rounds of scenarios, selecting appropriate scriptures and providing quick responses.

### Key Features

- **Mobile-First Design**: Optimized for smartphone use with large touch targets
- **Real-Time Gameplay**: Teams compete simultaneously with live scoring
- **Scripture Integration**: 14 carefully selected D&C scriptures with application guidance
- **Team Competition**: 6 teams with unique themes and emojis
- **Admin Controls**: Leader dashboard for game management
- **PWA Ready**: Installable as a mobile app

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd scripture-dominion-wol
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   - The app will open at `http://localhost:3000`
   - For mobile testing, use your computer's IP address on the same network

## 📱 How to Play

### For Leaders (Admin)

1. **Start the Game**
   - Open the app on your device
   - Click "Show Admin Options" → "Become Admin"
   - Click "Start New Game"
   - Share the 6-digit game code with players

2. **Manage the Game**
   - Monitor team responses in real-time
   - Assign quality scores (0-3 points) to each response
   - Control round progression
   - View live statistics

### For Players

1. **Join a Team**
   - Enter your name
   - Select a team (Light, Truth, Faith, Hope, Charity, or Virtue)
   - Click "Join Battle"

2. **Play Each Round**
   - Read the scenario that appears
   - Browse through 14 scripture cards
   - Select the most appropriate scripture
   - Write a quick response (max 100 characters)
   - Submit before time runs out!

3. **Scoring**
   - **Speed Bonus**: Faster submissions get more points
   - **Quality Score**: Admin assigns 0-3 points based on response quality
   - **Total Score**: Speed + Quality = Round Score

## 🎯 Game Flow

### Round Structure (3 minutes each)

1. **Scenario Display** (3 seconds)
   - All players see the same scenario simultaneously

2. **Scripture Selection** (2.5 minutes)
   - Players browse and select from 14 D&C scriptures
   - Each scripture includes reference, text, key principle, and application

3. **Response Submission** (2.5 minutes)
   - Write a concise response explaining the scripture's application
   - Submit before the timer expires

4. **Scoring & Results** (30 seconds)
   - Admin reviews responses and assigns quality scores
   - Round results are displayed
   - Leaderboard updates

### Victory Conditions

- **12 Rounds**: Complete all scenarios
- **Final Champion**: Team with highest total score
- **Tie Breaker**: Most responses submitted

## 📖 Scripture Content

The game includes 14 carefully selected D&C scriptures covering:

- **Self-Worth**: D&C 18:10, D&C 19:23
- **Prayer & Revelation**: D&C 1:37-38, D&C 25:12
- **Repentance & Forgiveness**: D&C 58:42-43
- **Priesthood**: D&C 84:20
- **Education & Learning**: D&C 88:118, D&C 90:24
- **Purpose & Truth**: D&C 93:24
- **Faith & Doubt**: D&C 6:36
- **Overcoming Challenges**: D&C 10:5, D&C 121:7-8
- **Service**: D&C 4:2, D&C 11:21

Each scripture includes:
- **Reference**: D&C chapter and verse
- **Text**: Full scripture passage
- **Key**: Main principle or teaching
- **Apply**: When to use this scripture

## 🎨 Technical Features

### Mobile Optimization

- **Touch-Friendly**: Minimum 44px touch targets
- **Responsive Design**: Works on all screen sizes
- **Fast Loading**: Optimized for mobile networks
- **PWA Ready**: Installable as mobile app

### Real-Time Features

- **LocalStorage Sync**: Simulates real-time updates
- **State Management**: React Context for game state
- **Auto-Sync**: Updates every second across devices

### Visual Design

- **Battle Theme**: "Light vs Darkness" aesthetic
- **Team Colors**: Unique gradients for each team
- **Animations**: Victory celebrations and transitions
- **Emojis**: Visual team identification

## 🛠️ Development

### Project Structure

```
src/
├── components/          # React components
│   ├── GameLobby.js     # Team joining interface
│   ├── GameBoard.js     # Main gameplay screen
│   ├── ScriptureCard.js # Scripture selection cards
│   ├── ResponseForm.js  # Response input form
│   ├── RoundTimer.js    # Countdown timer
│   ├── Leaderboard.js   # Live score display
│   ├── AdminPanel.js    # Admin controls
│   └── ResultsScreen.js # Victory celebration
├── context/
│   └── GameContext.js   # Game state management
├── data/
│   └── scriptures.js    # Scripture and scenario data
├── App.js              # Main app component
└── index.js            # App entry point
```

### Key Technologies

- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first styling
- **React Router**: Navigation and routing
- **LocalStorage**: State persistence and sync

### Customization

#### Adding New Scriptures

Edit `src/data/scriptures.js`:

```javascript
{
  id: 15,
  reference: "D&C 130:22",
  text: "The Father has a body of flesh and bones as tangible as man's...",
  key: "God has a physical body",
  apply: "When learning about the nature of God"
}
```

#### Modifying Scenarios

Edit the `scenarios` array in `src/data/scriptures.js`:

```javascript
export const scenarios = [
  "I feel worthless and don't matter",
  "Why do I need to be baptized?",
  // Add your scenarios here...
];
```

#### Changing Team Names

Edit the `teamNames` array in `src/data/scriptures.js`:

```javascript
export const teamNames = [
  "Team Light",
  "Team Truth", 
  // Customize team names...
];
```

## 📋 Setup Guide for Leaders

### Pre-Game Setup

1. **Test the App**
   - Run on your device first
   - Test admin controls
   - Verify mobile responsiveness

2. **Prepare Your Space**
   - Ensure stable internet connection
   - Have a device for admin control
   - Prepare backup plan for technical issues

3. **Gather Participants**
   - 6-24 youth (4-6 per team)
   - Each youth needs a smartphone
   - Modern browsers (iOS 12+, Android 8+)

### Game Day

1. **Start the Game**
   - Open app on admin device
   - Become admin and start new game
   - Display game code for all to see

2. **Team Formation**
   - Youth join teams using their phones
   - Monitor team sizes (aim for 2-4 per team)
   - Ensure all teams have players

3. **Run the Game**
   - Monitor responses in real-time
   - Assign fair quality scores
   - Keep energy high with encouragement

4. **Celebrate Victory**
   - Announce the champion team
   - Share final results
   - Export results if desired

## 🎯 Success Tips

### For Leaders

- **Practice First**: Run a test game with 2-3 people
- **Keep Energy High**: Use the battle theme and emojis
- **Fair Scoring**: Be consistent with quality scores
- **Time Management**: Keep rounds moving

### For Players

- **Read Carefully**: Understand the scenario before choosing
- **Think Fast**: Speed bonuses add up quickly
- **Be Specific**: Explain how the scripture applies
- **Work Together**: Discuss with your team

## 🐛 Troubleshooting

### Common Issues

**App won't load**
- Check internet connection
- Try refreshing the page
- Clear browser cache

**Teams can't join**
- Verify game code is correct
- Check if game is started
- Ensure all devices on same network

**Responses not syncing**
- Wait a few seconds for sync
- Check localStorage is enabled
- Refresh page if needed

**Mobile display issues**
- Rotate device to portrait mode
- Zoom out if text is too small
- Use modern browser

### Performance Tips

- **Close other apps** on mobile devices
- **Use WiFi** instead of mobile data
- **Limit background processes**
- **Keep devices charged**

## 📄 License

This project is created for educational and religious purposes. Feel free to modify and use for your youth groups.

## 🤝 Contributing

To improve the game:

1. **Add more scriptures** to the database
2. **Create new scenarios** for different age groups
3. **Improve mobile UI** for better user experience
4. **Add sound effects** for more engagement
5. **Create offline mode** for areas with poor internet

## 📞 Support

For questions or issues:

1. Check the troubleshooting section above
2. Review the code comments for technical details
3. Test with a small group first
4. Have a backup activity ready

---

**May the light of truth guide your path! ⚔️🌟** 