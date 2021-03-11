# What is this?
Robin Hanson's "Murder She Bet", turned from boardgame to video game. Robin's post on the boardgame is [here](https://www.overcomingbias.com/2018/08/my-board-board-game.html), and see [here](http://mason.gmu.edu/~rhanson/futarchy.pdf) and [here](https://mason.gmu.edu/~rhanson/gamble.html) for the philosophy behind it.

There is a [subreddit](https://www.reddit.com/r/MurderSheBet/)

# Why did you make this?
Originally, mostly because I was interested in the difference between physical activities / board games and virtual activities / video games. Murder, She Bet exists as a board game; I wanted to compare it with what it's like as a video game. I originally started this project during my PhD, which was in part focussed on the related question of whether [Dynamicland](dynamicland.org) will turn out to be a good idea.

![Boardgame](./assets/board.jpg)

As a video game, Murder She Bet is:

-Easier to play quickly

-Allows more intellectual energy to be spent on decisions (instead of what bills to pay with)

-Can use your geometrical intuition in thinking about money and contracts. This is better because numerals require parsing. Comparative magnitudes are all that matter, and you get that from line lengths.

-Anonymous. You don't have to know who has bets in what. In the board game, this occupies your mind a bunch; you're asking "who, of these people I am playing with, is going to win?". But while being a very human question, that question is irrelevant to making decisions that will help you win. For example, it encourages holding grudges against people.

-Harder to make, for me. Making the board took only a few hours, this took a few days. But easier to play for you I think!

-Easier to associate characters with columns of bets, because you can delete people with a single button press

Aside from the board game vs video game thing:
    1. Visualizing mathematics is interesting. This is especially true of statistics. Statistics, as a field, is abstract and dry - but much as I love geometry, statistics is probably the most important area of mathematics, because almost all human thought is statistical, though people foolishly pretend it isn't.

    2. Using games to express sophisticated ideas is generally very interesting to me. Games are certainly good for expressing ideas when, as here, the idea is a system.

    3. Prediction markets may or may not be a good idea. But at the very least we can agree that the modern academic system, which is in the background of much of science, is just awful (especially for something that's supposed to, and sometimes does, produce great things). It's so sickening that we should consider any alternative whatsoever to be something worthy of serious consideration.

    4. Probably I want to signal tribal allegiance with rationalists, plus intelligence! For more on this, see Robin's book The Elephant In The Brain ;D

# Specific pricing
I've tweaked the rewards a bit from the original, where the prices of contracts had to be multiples of 5. There's good reason to do this. One problem with discrete jumps, that the boardgame had is how the second smallest bet is TWICE as costly as the smallest bet. This is a bad discontinuity that many experienced game designers (at least those at Edinburgh Independent Game Developers) know to avoid!

If you'd like to fork this and change the prices, the key values are:
    1. pm.betsPerSuspect. In the original game this was *10*. I drastically increased this, which I think is a pure win: you can have more fine-grain control over your bets, which becomes possible because betting is so much faster than the board game.
    2. cheapestBet, which is measured as a proportion of the money that a successful bet wins. Set this to *0.09* to get bet values similar to the original game.
    3. startingCash, which is measured as a proportion of the total price of 1 full column's worth of contracts. In the original game this is about *0.6*. Although possibly it should be measured as a proportion of the price per winning bet. I currently feel I have very little of idea what this "should" be. I think at least it should be uncommon, but not unheard of, for people to buy the most expensive bets before the endgame. Also, it should probably be impossible for someone to buy all the bets in a column at the beginning of a game and then just leave it at that. I suppose people in general should also have enough money to make any bet that they think will be worth it (a microcosm of the real world I guess!).

# Can I contact you?
Please do, I'm @hamish_todd on twitter. My email is my first name, then my surname, then the numeral 1, at gmail.

# Credits
Camera click: Kwahmah https://freesound.org/people/kwahmah_02/sounds/260138/

Cash register: kiddpark https://freesound.org/people/kiddpark/sounds/201159/

Kick: soneproject https://freesound.org/people/soneproject/sounds/332362/

Take picture icon: https://icon-library.com/icon/take-picture-icon-10.html

Gavel: https://freesound.org/people/odditonic/sounds/187705/

The colorblindness-friendly color scheme for the bets is, of course, viridis, most badass of all color schemes, created by Nathaniel Smith and Stéfan van der Walt.

# License
MIT