# multi-lib
Mindustry library mod that contains multicrafter scripts
Support over Mindustry 6.0 version.

This branch (and releases) is for java.
Js can't use this mod's packages unless Anuke add this mod into Rhino.
This means only Java mod can use this mod.

What you can do with this library
1. Set multiple recipes in your crafter
2. Every input, output, craftTime can be differed
3. Selection table for which recipe to be enabled
4. Crafter can act as power generator according to recipe settings
5. Extensible block and entity function

How to use
----------
This instruction is based on gradle.
```
//in build.gradle
allprojects{
    repositories{
        ...
        maven{ url 'https://jitpack.io' }
    }
}
...
dependencies{
    //java-tag is release tag with prefix 'java-' ex) java-v1.0.2
    implementation 'com.github.younggam:multi-lib:java-tag'
}
```
contents

packages
```
import multilib.*;
import multilib.Recipe.*;
```
constructor of MultiCrafter
```
new MultiCrafter(String name, int recLen)
name : name of block
recLen : length of recipes
```
customizeable properties
```
dumpToggle : if true, crafter dumps output according to button. else, it always dumps output
isSmelter : if true, uses smelter as base. (only drawing changed)
```
method that adds recipe
```
addRecipe(InputContents input, new OutputContents output, float craftTime, boolean needUnlocked)
input : new InputContents(ItemStack[] items, LiquidStack[] liquids, float power)
output : new OutputContents(ItemStack[] items, LiquidStack[] liquids, float power)
needUnlocked : if true, items and liquids of corresponding recipe should be unlocked before research crafter.
addRecipe(InputContents input, new OutputContents output, float craftTime)
same as above but needUnlocked is false.

if you use
import static mindustry.type.ItemStack.*;
use with(item,amount,item,amount... ) instead new ItemStack[]{}
there is no alternative for new LiquidStack[]{} but you can omit. Check Recipe.java to know which is omitable.

craftTime : literally craftTime based on 60 ticks per a second.
```

example code
```
//in loadContent(){} or somewhere that eventually ran on loadContent
multi = new MultiCrafter("multi-test-2", 4){{
	requirements(Category.crafting, with(Items.copper, 10));
	size = 3;
	addRecipe(
	    new InputContents(with(Items.sand, 1, Items.lead, 1)),
	    new OutputContents(), 12f, true
	);
    addRecipe(
		new InputContents(with(Items.coal, 1, Items.sand, 1), new LiquidStack[]{new LiquidStack(Liquids.water, 5)}, 1),
	    new OutputContents(new LiquidStack[]{new LiquidStack(Liquids.slag, 5)}), 60f
	);
    addRecipe(
    	new InputContents(with(Items.pyratite, 1, Items.blastCompound, 1)),
    	new OutputContents(with(Items.scrap, 1, Items.plastanium, 2, Items.sporePod, 2)), 72f);
    addRecipe(
    	new InputContents(with(Items.sand, 1), 15),
    	new OutputContents(with(Items.silicon, 1), 10), 30f, true);
}};
```

ScreenShots
-----------
![제목 없음64](https://user-images.githubusercontent.com/61054554/78982290-c5905680-7b5c-11ea-9384-0b784f958ba8.png)
![제목 없음44](https://user-images.githubusercontent.com/61054554/78659489-9a142e80-7906-11ea-9e55-ab363c3fd970.png)
![제목 없음43](https://user-images.githubusercontent.com/61054554/78659495-9bddf200-7906-11ea-88a2-e68afd092dc9.png)
![제목 없음42](https://user-images.githubusercontent.com/61054554/78659501-9d0f1f00-7906-11ea-9ecc-abab9aaec827.png)
![제목 없음41](https://user-images.githubusercontent.com/61054554/78659511-9ed8e280-7906-11ea-901e-ab6195aa2355.png)
![제목 없음40](https://user-images.githubusercontent.com/61054554/78659515-a13b3c80-7906-11ea-844c-7ef07ac00f82.png)
![제목 없음39](https://user-images.githubusercontent.com/61054554/78659519-a3050000-7906-11ea-837f-d07777082424.png)
![제목 없음234](https://user-images.githubusercontent.com/61054554/98812885-aa752480-2466-11eb-8fa1-7c54271f3823.png)
