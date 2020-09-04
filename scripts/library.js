const _body = {
    getRecipes() {
        return this.recs;
    },
    invFrag: extend(BlockInventoryFragment, {
        _built: false,
        isBuilt() {
            return this._built;
        },
        visible: false,
        isShown() {
            return this.visible;
        },
        showFor(t) {
            this.visible = true;
            this.super$showFor(t);
        },
        hide() {
            this.visible = false;
            this.super$hide();
        },
        build(parent) {
            this._built = true;
            this.super$build(parent);
        }
    }),
    outputsItems() {
        return this.hasOutputItem;
    },
    //input이 충분한지 보는 자체 함수 newRecipes 필요
    checkinput(tile, i) {
        const entity = tile.ent();
        //items
        var items = this.recs[i].input.items;
        var liquids = this.recs[i].input.liquids;
        for (var j = 0, len = items.length; j < len; j++) {
            if (entity.items.get(items[j].item) < items[j].amount) return true;
        }
        //liquids
        for (var j = 0, len = liquids.length; j < len; j++) {
            if (entity.liquids.get(liquids[j].liquid) < liquids[j].amount) return true;
        }
        return false;
    },
    //custom function that checks space for item and liquid
    checkoutput(tile, i) {
        const entity = tile.ent();
        //items
        var items = this.recs[i].output.items;
        var liquids = this.recs[i].output.liquids;
        for (var j = 0, len = items.length; j < len; j++) {
            if (entity.items.get(items[j].item) + items[j].amount > this.itemCapacity) return true;
        }
        //liquids
        for (var j = 0, len = liquids.length; j < len; j++) {
            if (entity.liquids.get(liquids[j].liquid) + liquids[j].amount > this.liquidCapacity) return true;
        }
        return false;
    },
    //custom function that decides whether to produce
    checkCond(tile, i) {
        const entity = tile.ent();
        if (entity.power.status <= 0 && this.recs[i].input.power > 0) return false;
        //check power
        else if (this.checkinput(tile, i)) return false;
        else if (this.checkoutput(tile, i)) return false;
        else return true;
    },
    //custom function for consumeing items and liquids
    customCons(tile, i) {
        const entity = tile.ent();
        var excute = this.checkCond(tile, i);
        entity.saveCond(excute);
        if (excute) {
            //do produce
            if (entity.getProgress(i) != 0 && entity.getProgress(i) != null) {
                entity.progress = entity.getProgress(i);
                entity.saveProgress(i, 0);
            }
            entity.progress += this.getProgressIncreaseA(entity, i, this.recs[i].craftTime);
            entity.totalProgress += entity.delta();
            entity.warmup = Mathf.lerpDelta(entity.warmup, 1, 0.02);
            if (Mathf.chance(Time.delta() * this.updateEffectChance)) Effects.effect(this.updateEffect, entity.x + Mathf.range(this.size * 4), entity.y + Mathf.range(this.size * 4));
        } else entity.warmup = Mathf.lerp(entity.warmup, 0, 0.02);
    },
    //decides which item to accept
    acceptItem(item, tile, source) {
        const entity = tile.ent();
        if (entity == null) return false;
        if (entity.items.get(item) >= this.itemCapacity) return false;
        return this.inputItemSet.contains(item);
    },
    //decides which liquid to accept
    acceptLiquid(tile, source, liquid, amount) {
        const entity = tile.ent();
        if (entity == null) return false;
        if (entity.liquids.get(liquid) + amount > this.liquidCapacity) return false;
        return this.inputLiquidSet.contains(liquid);
    },
    //displays whether input is enough
    displayConsumption(tile, table) {
        const entity = tile.ent();
        var z = 0;
        var y = 0;
        var x = 0;
        var recLen = this.recs.length;
        table.left();
        //input 아이템, 액체 그림 띄우기
        for (var i = 0; i < recLen; i++) {
            var items = this.recs[i].input.items;
            var liquids = this.recs[i].input.liquids;
            //아이템
            for (var j = 0, len = items.length; j < len; j++) {
                (function(j, items) {
                    table.add(new ReqImage(new ItemImage(items[j].item.icon(Cicon.medium), items[j].amount), boolp(() => entity.items != null && entity.items.has(items[j].item, items[j].amount)))).size(8 * 4);
                })(j, items);
            }
            z += len;
            //액체
            for (var l = 0, len = liquids.length; l < len; l++) {
                (function(l, liquids) {
                    table.add(new ReqImage(new ItemImage(liquids[l].liquid.icon(Cicon.medium), liquids[l].amount), boolp(() => entity.liquids != null && entity.liquids.get(liquids[l].liquid) > liquids[l].amount))).size(8 * 4);
                })(l, liquids);
            }
            z += len;
            //아이템 유뮤 바에서 레시피 구분및 자동 줄바꿈을 위해 정리된 input item 필요.
            if (z == 0) {
                table.addImage(Icon.cancel).size(8 * 4);
                x += 1;
            }
            if (i < recLen - 1) {
                var next = this.recs[i + 1].input;
                y += next.items.length + next.liquids.length;
                x += z;
                if (x + y <= 7 && y != 0) {
                    table.addImage(Icon.pause).size(8 * 4);
                    x += 1;
                } else if (x + y <= 6 && y == 0) {
                    table.addImage(Icon.pause).size(8 * 4);
                    x += 1;
                } else {
                    table.row();
                    x = 0;
                }
            }
            y = 0;
            z = 0;
        }
    },
    displayInfo(table) {
        this.super$displayInfo(table);
        var recLen = this.recs.length;
        for (var i = 0; i < recLen; i++) {
            var rec = this.recs[i];
            var outputItems = rec.output.items,
                inputItems = rec.input.items;
            var outputLiquids = rec.output.liquids,
                inputLiquids = rec.input.liquids;
            var inputPower = this.recs[i].input.power,
                outputPower = this.recs[i].output.power;
            table.table(this.infoStyle.up, cons(part => {
                part.add("[accent]" + BlockStat.input.localized()).left().row();
                part.table(cons(row => {
                    for (var l = 0, len = inputItems.length; l < len; l++) row.add(new ItemDisplay(inputItems[l].item, inputItems[l].amount, true)).padRight(5);
                })).left().row();
                part.table(cons(row => {
                    for (var l = 0, len = inputLiquids.length; l < len; l++) row.add(new LiquidDisplay(inputLiquids[l].liquid, inputLiquids[l].amount, false));
                })).left().row();
                if (inputPower > 0) {
                    part.table(cons(row => {
                        row.add("[lightgray]" + BlockStat.powerUse.localized() + ":[]").padRight(4);
                        (new NumberValue(inputPower * 60, StatUnit.powerSecond)).display(row);
                    })).left().row();
                }
                part.add("[accent]" + BlockStat.output.localized()).left().row();
                part.table(cons(row => {
                    for (var jj = 0, len = outputItems.length; jj < len; jj++) row.add(new ItemDisplay(outputItems[jj].item, outputItems[jj].amount, true)).padRight(5);
                })).left().row();
                part.table(cons(row => {
                    for (var jj = 0, len = outputLiquids.length; jj < len; jj++) row.add(new LiquidDisplay(outputLiquids[jj].liquid, outputLiquids[jj].amount, false));
                })).left().row();
                if (outputPower) {
                    part.table(cons(row => {
                        row.add("[lightgray]" + BlockStat.basePowerGeneration.localized() + ":[]").padRight(4);
                        (new NumberValue(outputPower, StatUnit.powerSecond)).display(row);
                    })).left().row();
                }
                part.table(cons(row => {
                    row.add("[lightgray]" + BlockStat.productionTime.localized() + ":[]").padRight(4);
                    (new NumberValue(rec.craftTime / 60, StatUnit.seconds)).display(row);
                })).left().row();
                if (typeof this["customDisplay"] === "function") this.customDisplay(part, i);
            })).color(Pal.accent).left();
            table.add().size(18).row();
        }
    },
    //for dislpying info
    setStats() {
        this.super$setStats();
        this.stats.remove(BlockStat.powerUse);
        this.stats.remove(BlockStat.productionTime);
    },
    //for displaying bars
    setBars() {
        this.super$setBars();
        //initialize
        this.bars.remove("liquid");
        this.bars.remove("items");
        if (!this.powerBarI) {
            this.bars.remove("power");
        }
        if (this.powerBarO) {
            this.bars.add("poweroutput", func(entity =>
                new Bar(prov(() => Core.bundle.format("bar.poweroutput", entity.block.getPowerProduction(entity.tile) * 60 * entity.timeScale)), prov(() => Pal.powerBar), floatp(() => typeof entity["getPowerStat"] === "function" ? entity.getPowerStat() : 0))
            ));
        }
        //display every Liquids that can contain
        var i = 0;
        if (!this.liquidSet.isEmpty()) {
            this.liquidSet.each(cons(k => {
                this.bars.add("liquid" + i, func(entity =>
                    new Bar(prov(() => k.localizedName), prov(() => k.barColor()), floatp(() => entity.liquids.get(k) / this.liquidCapacity))
                ));
                i++;
            }));
        }
    },
    //for progress
    getProgressIncreaseA(entity, i, baseTime) {
        //when use power
        if (this.recs[i].input.power > 0) return this.getProgressIncrease(entity, baseTime);
        else return 1 / baseTime * entity.delta();
    },
    //acutal power prodcution
    getPowerProduction(tile) {
        const entity = tile.ent();
        var i = entity.getToggle();
        if (i < 0) return 0;
        var oPower = this.recs[i].output.power;
        if (oPower > 0 && entity.getCond()) {
            if (this.recs[i].input.power > 0) {
                entity.setPowerStat(entity.efficiency());
                return oPower * entity.efficiency();
            } else {
                entity.setPowerStat(1);
                return oPower;
            }
        }
        entity.setPowerStat(0);
        return 0;
    },
    //custom function that add or remove items when progress is ongoing.
    customProd(tile, i) {
        const entity = tile.ent();
        //consume items
        var inputItems = this.recs[i].input.items;
        var inputLiquids = this.recs[i].input.liquids;
        var outputItems = this.recs[i].output.items;
        var outputLiquids = this.recs[i].output.liquids;
        var eItems = entity.items;
        var eLiquids = entity.liquids;
        for (var k = 0, len = inputItems.length; k < len; k++) eItems.remove(inputItems[k]);
        //consume liquids
        for (var j = 0, len = inputLiquids.length; j < len; j++) eLiquids.remove(inputLiquids[j].liquid, inputLiquids[j].amount);
        //produce items
        for (var a = 0, len = outputItems.length; a < len; a++) {
            this.useContent(tile, outputItems[a].item);
            for (var aa = 0, amount = outputItems[a].amount; aa < amount; aa++) {
                this.offloadNear(tile, outputItems[a].item);
            }
        }
        //produce liquids
        for (var j = 0, len = outputLiquids.length; j < len; j++) {
            this.useContent(tile, outputLiquids[j].liquid);
            this.handleLiquid(tile, tile, outputLiquids[j].liquid, outputLiquids[j].amount);
        }
        Effects.effect(this.craftEffect, tile.drawx(), tile.drawy());
        entity.progress = 0;
    },
    shouldIdleSound(tile) {
        return tile.entity.getCond();
    },
    //update. called every tick
    update(tile) {
        const entity = tile.ent();
        if (!this.invFrag.isShown() && Vars.control.input.frag.config.isShown() && Vars.control.input.frag.config.getSelectedTile() == tile) {
            this.invFrag.showFor(tile);
        }
        var recLen = this.recs.length;
        var current = entity.getToggle();
        //to not rewrite whole update
        if (typeof this["customUpdate"] === "function") this.customUpdate(tile);
        //calls customCons and customProd
        if (current >= 0) {
            this.customCons(tile, current);
            if (entity.progress >= 1) this.customProd(tile, current);
        }
        var eItems = entity.items;
        var eLiquids = entity.liquids;
        //dump
        var itemTimer = entity.timer.get(this.timerDump, this.dumpTime);
        if (this.dumpToggle && current > -1) {
            var items = this.recs[current].output.items;
            var liquids = this.recs[current].output.liquids;
            if (itemTimer) {
                for (var i = 0, len = items.length; i < len; i++) {
                    if (eItems.has(items[i].item)) {
                        this.tryDump(tile, items[i].item);
                        break;
                    }
                }
            }
            for (var i = 0, len = liquids.length; i < len; i++) {
                if (eLiquids.get(liquids[i].liquid) > 0.001) {
                    this.tryDumpLiquid(tile, liquids[i].liquid);
                    break;
                }
            }
        } else {
            //TODO 반복문 줄이기
            if (itemTimer && eItems.total() > 0) {
                var itemIter = this.outputItemSet.iterator();
                while (itemIter.hasNext()) {
                    var item = itemIter.next();
                    if (eItems.has(item)) {
                        this.tryDump(tile, item);
                        break;
                    }
                }
            }
            if (eLiquids.total() > 0.001) {
                var liquidIter = this.outputLiquidSet.iterator();
                while (liquidIter.hasNext()) {
                    var liquid = liquidIter.next();
                    if (eLiquids.get(liquid) > 0.001) {
                        this.tryDumpLiquid(tile, liquid);
                        break;
                    }
                }
            }
        }
    },
    //initialize
    init() {
        for (var i = 0; i < this.tmpRecs.length; i++) {
            var tmp = this.tmpRecs[i];
            var isInputExist = tmp.input != null,
                isOutputExist = tmp.output != null;
            var tmpInput = tmp.input;
            var tmpOutput = tmp.output;
            if (isInputExist && tmpInput.power > 0) this.powerBarI = true;
            if (isOutputExist && tmpOutput.power > 0) this.powerBarO = true;
            this.recs[i] = {
                input: {
                    items: [],
                    liquids: [],
                    power: isInputExist ? typeof tmpInput.power == "number" ? tmpInput.power : 0 : 0
                },
                output: {
                    items: [],
                    liquids: [],
                    power: isOutputExist ? typeof tmpOutput.power == "number" ? tmpOutput.power : 0 : 0
                },
                craftTime: typeof tmp.craftTime == "number" ? tmp.craftTime : 80
            };
            var vc = Vars.content;
            var ci = ContentType.item;
            var cl = ContentType.liquid;
            var realInput = this.recs[i].input;
            var realOutput = this.recs[i].output;
            if (isInputExist) {
                if (tmpInput.items != null) {
                    for (var j = 0, len = tmpInput.items.length; j < len; j++) {
                        if (typeof tmpInput.items[j] != "string") throw "It is not string at " + j + "th input item in " + i + "th recipe";
                        var words = tmpInput.items[j].split("/");
                        if (words.length != 2) throw "Malform at " + j + "th input item in " + i + "th recipe";
                        var item = vc.getByName(ci, words[0]);
                        if (item == null) throw "Invalid item: " + words[0] + " at " + j + "th input item in " + i + "th recipe";
                        this.inputItemSet.add(item);
                        if (isNaN(words[1])) throw "Invalid amount: " + words[1] + " at " + j + "th input item in " + i + "th recipe";
                        realInput.items[j] = new ItemStack(item, words[1] * 1);
                    }
                }
                if (tmpInput.liquids != null) {
                    for (var j = 0, len = tmpInput.liquids.length; j < len; j++) {
                        if (typeof tmpInput.liquids[j] != "string") throw "It is not string at " + j + "th input liquid in " + i + "th recipe";
                        var words = tmpInput.liquids[j].split("/");
                        if (words.length != 2) throw "Malform at " + j + "th input liquid in " + i + "th recipe";
                        var liquid = vc.getByName(cl, words[0]);
                        if (liquid == null) throw "Invalid liquid: " + words[0] + " at " + j + "th input liquid in " + i + "th recipe";
                        this.inputLiquidSet.add(liquid);
                        this.liquidSet.add(liquid);
                        if (isNaN(words[1])) throw "Invalid amount: " + words[1] + " at " + j + "th input liquid in " + i + "th recipe";
                        realInput.liquids[j] = new LiquidStack(liquid, words[1] * 1);
                    }
                }
            }
            if (isOutputExist) {
                if (tmpOutput.items != null) {
                    for (var j = 0, len = tmpOutput.items.length; j < len; j++) {
                        if (typeof tmpOutput.items[j] != "string") throw "It is not string at " + j + "th output item in " + i + "th recipe";
                        var words = tmpOutput.items[j].split("/");
                        if (words.length != 2) throw "Malform at " + j + "th output item in " + i + "th recipe"
                        var item = vc.getByName(ci, words[0]);
                        if (item == null) throw "Invalid item: " + words[0] + " at " + j + "th output item in " + i + "th recipe";
                        this.outputItemSet.add(item);
                        if (isNaN(words[1])) throw "Invalid amount: " + words[1] + " at " + j + "th output item in " + i + "th recipe";
                        realOutput.items[j] = new ItemStack(item, words[1] * 1);
                    }
                    if (j != 0) this.hasOutputItem = true;
                }
                if (tmpOutput.liquids != null) {
                    for (var j = 0, len = tmpOutput.liquids.length; j < len; j++) {
                        if (typeof tmpOutput.liquids[j] != "string") throw "It is not string at " + j + "th output liquid in " + i + "th recipe";
                        var words = tmpOutput.liquids[j].split("/");
                        if (words.length != 2) throw "Malform at " + j + "th output liquid in " + i + "th recipe";
                        var liquid = vc.getByName(cl, words[0]);
                        if (liquid == null) throw "Invalid liquid: " + words[0] + " at " + j + "th output liquid in " + i + "th recipe";
                        this.outputLiquidSet.add(liquid);
                        this.liquidSet.add(liquid);
                        if (isNaN(words[1])) throw "Invalid amount: " + words[1] + " at " + j + "th output liquid in " + i + "th recipe";
                        realOutput.liquids[j] = new LiquidStack(liquid, words[1] * 1);
                    }
                }
            }
        }
        this.super$init();
        this.consumesPower = this.powerBarI;
        this.outputsPower = this.powerBarO;
        this.infoStyle = Core.scene.getStyle(Button.ButtonStyle);
    },
    //show config menu
    buildConfiguration(tile, table) {
        const entity = tile.ent();
        if (!this.invFrag.isBuilt()) this.invFrag.build(table.getParent());
        if (this.invFrag.isShown()) {
            this.invFrag.hide();
            Vars.control.input.frag.config.hideConfig();
            return;
        }
        var group = new ButtonGroup();
        group.setMinCheckCount(0);
        group.setMaxCheckCount(1);
        var recLen = this.recs.length;
        for (var i = 0; i < recLen; i++) {
            //representative images
            (function(i, recs) {
                var output = recs[i].output;
                var button = table.addImageButton(Tex.whiteui, Styles.clearToggleTransi, 40, run(() => tile.configure(button.isChecked() ? i : -1))).group(group).get();
                button.getStyle().imageUp = new TextureRegionDrawable(output.items.length > 0 ? output.items[0].item.icon(Cicon.small) : output.liquids.length > 0 ? output.liquids[0].liquid.icon(Cicon.small) : output.power > 0 ? Icon.power : Icon.cancel);
                button.update(run(() => button.setChecked(typeof entity["getToggle"] === "function" ? entity.getToggle() == i : false)));
            })(i, this.recs);
        }
        table.row();
        //other images
        var lengths = [];
        var max = 0;
        for (var l = 0; l < recLen; l++) {
            var output = this.recs[l].output;
            var outputItemLen = output.items.length;
            var outputLiquidLen = output.liquids.length;
            if (lengths[l] == null) lengths[l] = [0, 0, 0];
            if (outputItemLen > 0) lengths[l][0] = outputItemLen - 1;
            if (outputLiquidLen > 0) {
                if (outputItemLen > 0) lengths[l][1] = outputLiquidLen;
                else lengths[l][1] = outputLiquidLen - 1;
            }
            if (output.power > 0) lengths[l][2] = 1;
        }
        for (var i = 0; i < recLen; i++) {
            max = max < lengths[i][0] + lengths[i][1] + lengths[i][2] ? lengths[i][0] + lengths[i][1] + lengths[i][2] : max;
        }
        for (var i = 0; i < max; i++) {
            for (var j = 0; j < recLen; j++) {
                var output = this.recs[j].output;
                var outputItemLen = output.items.length;
                var outputLiquidLen = output.liquids.length;
                if (lengths[j][0] > 0) {
                    table.addImage(output.items[outputItemLen - lengths[j][0]].item.icon(Cicon.small));
                    lengths[j][0]--;
                } else if (lengths[j][1] > 0) {
                    table.addImage(output.liquids[outputLiquidLen - lengths[j][1]].liquid.icon(Cicon.small));
                    lengths[j][1]--;
                } else if (lengths[j][2] > 0) {
                    if (output.items[0] != null || output.liquids[0] != null) {
                        table.addImage(Icon.power);
                    } else table.addImage(Tex.clear);
                    lengths[j][2]--;
                } else {
                    table.addImage(Tex.clear);
                }
            }
            table.row();
        }
    },
    //save which buttons is pressed
    configured(tile, player, value) {
        const entity = tile.ent();
        //save current progress.
        if (entity.getToggle() >= 0) entity.saveProgress(entity.getToggle(), entity.progress);
        if (value == -1) entity.saveCond(false);
        entity.progress = 0;
        entity.setToggle(value);
    },
    onConfigureTileTapped(tile, other) {
        if (tile != other) this.invFrag.hide();
        return true;
    },
    removed(tile) {
        this.invFrag.hide();
    }
};
module.exports = {
    body: _body
}
