# What is this?
This is a game, originally a [board game](https://www.overcomingbias.com/2018/08/my-board-board-game.html)) designed by the social scientist / philosopher Robin Hanson, turned into a video game. The boardgame is about, on the surface, betting on murder mysteries. But really it is deeper than that.

# "Prediction Markets"?
Murder She Bet (MSB) is actually an as-simple-as-possible example of a Prediction Market (PM), an institution designed by Hanson that has implications, I would say, for both science and politics. Prediction Markets are encourage making probabilistic predictions, where you make explicit both your beliefs and your levels of confidence in those beliefs. This is a good thing, both board games and in decision-making institutions, for three reasons:

1. Bayesian statistics is an objectively very helpful way to see the world, and you get better at it with practice. When playing MSB, people seem to use it intuitively. If two new suspects are introduced, almost by definition they start out with equal probability. But when new information comes along (eg, "the victim changed their will"), there's a clear sense in which all the players "update" by thinking "would I see this evidence in the situation where suspect X hasn't done it? Would I see it in the situation situation where they have done it?", and adjust their bets accordingly. They even try to form a clear anticipation of something to happen in the next few scenes - you see them buying 3 bets, waiting, and then selling the bets if they don't see what they expected. It's science! Of a kind.

2. People often lie about their beliefs, but that becomes basically impossible when there's a prediction market around. If you watch a murder mystery in the ordinary way (on the sofa, with your family), you expect to see a lot of people posturing, saying crap like "oh well of COURSE X did it then". With a prediction market, if a person *wants* to say something like that, everyone knows what they should do: *if they really believe 100% that that person is guilty*, they should buy every bet on that suspect. If they don't do this, i.e. they don't "put their money where their mouth is", you know they don't mean what they said.

3. The market aggregates information in a clever way. As you play, you'll see that, at any given time, the price of a suspect's bets tells you the probability that the players ascribe to the belief that that suspect did it. This means that they can be used to trade money (in the form of promises to pay off bets) for consensus beliefs.

Hanson has written proposals for PMs to predict how scientific theories will hold up [(link)](http://mason.gmu.edu/~rhanson/futarchy.pdf), and even for deciding what policies to implement to give voters what they want out of a government [(link)](https://mason.gmu.edu/~rhanson/gamble.html).

# Can I contact you?
Please do, I'm @hamish_todd on twitter. My email is my first name, then my surname, then the numeral 1, at gmail.

# Original motivation: board game versus video game
I originally wanted to make this because I was interested in the difference between physical activities / board games and virtual activities / video games. Murder, She Bet exists as a board game; I wanted to compare it with what it's like as a video game. I originally started this project during my PhD, which was in part focussed on the related question of whether [Dynamicland](dynamicland.org) will turn out to be a good idea.

![Boardgame](./assets/board.jpg)

As a video game, Murder She Bet is:

* Easier to play quickly

* Allows more intellectual energy to be spent on decisions (instead of what bills to pay with)

* Can use your geometrical intuition in thinking about money and contracts. This is better because numerals require parsing. Comparative magnitudes are all that matter, and you get that from line lengths.

* Anonymous. You don't have to know who has bets in what. In the board game, this occupies your mind a bunch; you're asking "who, of these people I am playing with, is going to win?". But while being a very human question, that question is irrelevant to making decisions that will help you win. For example, it encourages holding grudges against people.

* Harder to make, for me. Making the board took only a few hours, this took a few days. But easier to play for you I think!

* Easier to associate characters with columns of bets, because you can delete people with a single button press

* Is able to have a leaderboard at the end rather than a simple win/loss, so people's skill is more accurately and proportionately reported. This, I think, combats a problem pointed out by [Zvi Moshowitz](https://www.lesswrong.com/posts/fs2ozRQ4osJr9Wbfu/on-robin-hanson-s-board-game) that in the boardgame, that the endgame has distorted incentives that point away from buy bets that reflect your belief about the probability of a suspect's guilt.

Aside from the board game vs video game thing:
* Visualizing mathematics is interesting. This is especially true of statistics. Statistics, as a field, is abstract and dry - but much as I love geometry, statistics is probably the most important area of mathematics, because almost all human thought is statistical, though people foolishly pretend it isn't.

* Using games to express sophisticated ideas is generally very interesting to me. Games are certainly good for expressing ideas when, as here, the idea is a system.

* Prediction markets may or may not be a good idea. But at the very least we can agree that the modern academic system, which is in the background of much of science, is just awful (especially for something that's supposed to, and sometimes does, produce great things). It's so sickening that we should consider any alternative whatsoever to be something worthy of serious consideration.

* Probably I want to signal tribal allegiance with rationalists, plus intelligence! For more on this, see Robin's book The Elephant In The Brain! One piece of evidence for this is that I always thought of my interest in games-as-communication as being mostly about level design, but Murder She bet has no level design.

# Specific pricing
I've tweaked the rewards a bit from the original, where the prices of contracts had to be multiples of 5. There's good reason to do this. One problem with discrete jumps, that the boardgame had is how the second smallest bet is TWICE as costly as the smallest bet. This is a bad discontinuity that many experienced game designers (at least those at Edinburgh Independent Game Developers) know to avoid!

If you'd like to fork this and change the prices, the key values are:
* pm.betsPerSuspect. In the original game this was *10*. I drastically increased this, which I think is a pure win: you can have more fine-grain control over your bets, which becomes possible because betting is so much faster than the board game.

* cheapestBet, which is measured as a proportion of the money that a successful bet wins. Set this to *0.09* to get bet values similar to the original game.
    
* startingCash, which is measured as a proportion of the total price of 1 full column's worth of contracts. In the original game this is about *0.6*. Although possibly it should be measured as a proportion of the price per winning bet. I currently feel I have very little of idea what this "should" be. I think at least it should be uncommon, but not unheard of, for people to buy the most expensive bets before the endgame. Also, it should probably be impossible for someone to buy all the bets in a column at the beginning of a game and then just leave it at that. I suppose people in general should also have enough money to make any bet that they think will be worth it (a microcosm of the real world I guess!).

# Credits
Camera click: Kwahmah https://freesound.org/people/kwahmah_02/sounds/260138/

Cash register: kiddpark https://freesound.org/people/kiddpark/sounds/201159/

Kick: soneproject https://freesound.org/people/soneproject/sounds/332362/

Take picture icon: https://icon-library.com/icon/take-picture-icon-10.html

Gavel: https://freesound.org/people/odditonic/sounds/187705/

Pop: LloydEvans09 https://freesound.org/people/LloydEvans09/sounds/321807/

Money: wobesound https://freesound.org/people/wobesound/sounds/488399/

Get Item: mrthenoronha https://freesound.org/people/Mrthenoronha/sounds/516824/

Yoink: fupicat https://freesound.org/people/Fupicat/sounds/538148/

Announcing sound: FoolBoyMedia https://freesound.org/people/FoolBoyMedia/sounds/234525/

The colorblindness-friendly color scheme for the bets is, of course, viridis, most badass of all color schemes, created by Nathaniel Smith and Stéfan van der Walt.

# License
MIT