# ABC Notation Examples

This file contains various ABC notation examples that can be used with the Partitura MCP server.

## Simple Scale

```abc
X:1
T:C Major Scale
M:4/4
L:1/4
K:C
C D E F | G A B c |
```

## Twinkle Twinkle Little Star

```abc
X:1
T:Twinkle Twinkle Little Star
C:Traditional
M:4/4
L:1/4
K:C
CC GG | AA G2 | FF EE | DD C2 |
GG FF | EE D2 | GG FF | EE D2 |
CC GG | AA G2 | FF EE | DD C2 |]
```

## Happy Birthday

```abc
X:1
T:Happy Birthday
C:Traditional
M:3/4
L:1/4
K:C
G/2>G/2 | A G c | B2 G/2>G/2 | A G d | c2 G/2>G/2 |
g e c | B A F/2>F/2 | e c d | c2 |]
```

## Ode to Joy (Beethoven)

```abc
X:1
T:Ode to Joy
C:Ludwig van Beethoven
M:4/4
L:1/4
K:C
E E F G | G F E D | C C D E | E3/2 D/2 D2 |
E E F G | G F E D | C C D E | D3/2 C/2 C2 |
D D E C | D E/2F/2 E C | D E/2F/2 E D | C D G,2 |
E E F G | G F E D | C C D E | D3/2 C/2 C2 |]
```

## Mary Had a Little Lamb

```abc
X:1
T:Mary Had a Little Lamb
C:Traditional
M:4/4
L:1/4
K:C
E D C D | E E E2 | D D D2 | E G G2 |
E D C D | E E E E | D D E D | C4 |]
```

## Jingle Bells (Chorus)

```abc
X:1
T:Jingle Bells (Chorus)
C:James Lord Pierpont
M:4/4
L:1/8
K:G
B2 B2 B4 | B2 B2 B4 | B2 d2 G2 A2 | B8 |
c2 c2 c2 c2 | c2 B2 B2 B2 | B2 A2 A2 B2 | A4 d4 |
B2 B2 B4 | B2 B2 B4 | B2 d2 G2 A2 | B8 |
c2 c2 c2 c2 | c2 B2 B2 B2 | d2 d2 c2 A2 | G8 |]
```

## Amazing Grace

```abc
X:1
T:Amazing Grace
C:John Newton
M:3/4
L:1/4
K:G
D | G2 B/2A/2 | G2 B | B2 A | G2 E |
D2 D | G2 B/2A/2 | G4 z2 |
B2 d | d2 B | d2 B | B2 A | G2 E |
D2 G | G2 E | G4 z2 |]
```

## Für Elise (Opening)

```abc
X:1
T:Für Elise (Opening)
C:Ludwig van Beethoven
M:3/8
L:1/16
K:Am
e^d | e^de B d c | A3 z CE | A B | E3 z GB |
e^d | e^de B d c | A3 z CE | A B | E3 z z2 |]
```

## Greensleeves

```abc
X:1
T:Greensleeves
C:Traditional English
M:6/8
L:1/8
K:Em
E | G2 A B2 c | d3 e2 d | B2 G G2 ^F | G3 E2 E |
G2 A B2 c | d3 e2 d | B2 G ^F2 ^D | E6- | E2 z |
d3 e2 d | B2 G G2 ^F | G3 E2 E | G2 A B2 c |
d3 e2 d | B2 G ^F2 ^D | E6- | E2 z |]
```

## Canon in D (Pachelbel) - Main Theme

```abc
X:1
T:Canon in D
C:Johann Pachelbel
M:4/4
L:1/8
K:D
^f2 e2 d2 ^c2 | d2 A2 B2 ^f2 | g2 ^f2 e2 d2 | ^c2 B2 A4 |
B2 ^c2 d2 e2 | ^f2 g2 a2 g2 | ^f2 e2 d2 ^c2 | d8 |]
```

## When the Saints Go Marching In

```abc
X:1
T:When the Saints Go Marching In
C:Traditional
M:4/4
L:1/4
K:C
C E F G | z2 C E | F G z2 | C E F G |
E2 C E | D4 | E D C E | C4 |
C E F G | z2 C E | F G z2 | E C E D |
C8 |]
```

## Usage Examples

### Basic Conversion

Using the stdio server:
```javascript
{
  "abc_notation": "X:1\nT:Scale\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c |",
  "title": "C Major Scale",
  "composer": "Exercise"
}
```

### Complex Score

```javascript
{
  "abc_notation": "X:1\nT:Amazing Grace\nC:John Newton\nM:3/4\nL:1/4\nK:G\nD | G2 B/2A/2 | G2 B | B2 A | G2 E |\nD2 D | G2 B/2A/2 | G4 z2 |",
  "title": "Amazing Grace",
  "composer": "John Newton"
}
```

### Multiple Voices

ABC notation supports multiple voices:

```abc
X:1
T:Two Part Invention
C:Example
M:4/4
L:1/8
K:C
V:1
CDEF GABc | cBAG FEDC |
V:2 bass
C,2E,2 G,2C2 | C2G,2 E,2C,2 |
```

## Tips for Better Results

1. **Always include required headers**: X (reference), K (key)
2. **Use proper bar lines**: Single `|` or double `||` for sections
3. **Specify note lengths**: Use L: field to set default length
4. **Add titles and composers**: Makes PDFs more professional
5. **Use proper key signatures**: K:C, K:G, K:Dm, etc.
6. **Consider spacing**: Blank lines separate sections
7. **Test notation first**: Use an ABC notation validator before converting

## ABC Notation Resources

- [ABC Notation Standard](http://abcnotation.com/)
- [ABC Notation Tutorial](http://abcnotation.com/learn)
- [ABC Examples Repository](http://abcnotation.com/examples)
- [ABC Notation Editor Online](https://editor.drawthedots.com/)
