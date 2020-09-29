function MultiCrafter() {
    //별개 값
    this.tmpRecs = [];
    this.recs = [];
    this.infoStyle = null;
    this.getRecipes = function() {
        return this.recs;
    };
    this.liquidSet = new ObjectSet();
    this.hasOutputItem = false;
    this.inputItemSet = new ObjectSet();
    this.inputLiquidSet = new ObjectSet();
    this.outputItemSet = new ObjectSet();
    this.outputLiquidSet = new ObjectSet();
    this.dumpToggle = false;
    this.powerBarI = false;
    this.powerBarO = false;
    this.invFrag = extend(BlockInventoryFragment, {
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
    });
    this.outputsItems = function() {
        return this.hasOutputItem;
    };
    //input이 충분한지 보는 자체 함수 newRecipes 필요
    this.checkinput = function(tile, i) {
        const entity = tile.ent();
        //items
        var items = this.recs[i].input.items;
        var liquids = this.recs[i].input.liquids;
        if(!entity.items.has(items)) return true;
        //liquids
        for(var j = 0, len = liquids.length; j < len; j++) {
            if(entity.liquids.get(liquids[j].liquid) < liquids[j].amount) return true;
        }
        return false;
    };
    //custom function that checks space for item and liquid
    this.checkoutput = function(tile, i) {
        const entity = tile.ent();
        //items
        var items = this.recs[i].output.items;
        var liquids = this.recs[i].output.liquids;
        for(var j = 0, len = items.length; j < len; j++) {
            if(entity.items.get(items[j].item) + items[j].amount > this.itemCapacity) return true;
        }
        //liquids
        for(var j = 0, len = liquids.length; j < len; j++) {
            if(entity.liquids.get(liquids[j].liquid) + liquids[j].amount > this.liquidCapacity) return true;
        }
        return false;
    };
    //custom function that decides whether to produce
    this.checkCond = function(tile, i) {
        const entity = tile.ent();
        if(entity.power.status <= 0 && this.recs[i].input.power > 0) return false;
        //check power
        else if(this.checkinput(tile, i)) return false;
        else if(this.checkoutput(tile, i)) return false;
        else return true;
    };
    //custom function for consumeing items and liquids
    this.customCons = function(tile, i) {
        const entity = tile.ent();
        var excute = this.checkCond(tile, i);
        entity.saveCond(excute);
        if(excute) {
            //do produce
            if(entity.getProgress(i) != 0 && entity.getProgress(i) != null) {
                entity.progress = entity.getProgress(i);
                entity.saveProgress(i, 0);
            }
            entity.progress += this.getProgressIncreaseA(entity, i, this.recs[i].craftTime);
            entity.totalProgress += entity.delta();
            entity.warmup = Mathf.lerpDelta(entity.warmup, 1, 0.02);
            if(Mathf.chance(Time.delta() * this.updateEffectChance)) Effects.effect(this.updateEffect, entity.x + Mathf.range(this.size * 4), entity.y + Mathf.range(this.size * 4));
        } else entity.warmup = Mathf.lerp(entity.warmup, 0, 0.02);
    };
    //decides which item to accept
    this.acceptItem = function(item, tile, source) {
        const entity = tile.ent();
        if(entity == null || entity.items == null) return false;
        if(entity.items.get(item) >= this.itemCapacity) return false;
        return this.inputItemSet.contains(item);
    };
    //decides which liquid to accept
    this.acceptLiquid = function(tile, source, liquid, amount) {
        const entity = tile.ent();
        if(entity == null) return false;
        if(entity.liquids.get(liquid) + amount > this.liquidCapacity) return false;
        return this.inputLiquidSet.contains(liquid);
    };
    this.removeStack = function(tile, item, amount) {
        const entity = tile.ent();
        var ret = this.super$removeStack(tile, item, amount);
        if(!entity.items.has(item)) entity.getToOutputItemSet().remove(item);
        return ret;
    };
    this.handleItem = function(item, tile, source) {
        const entity = tile.ent(),
            current = entity.getToggle();
        if((this.dumpToggle ? current > -1 && this.recs[current].output.items.some(a => a.item == item) : this.outputItemSet.contains(item)) && !entity.items.has(item)) entity.getToOutputItemSet().add(item);
        entity.items.add(item, 1);
    };
    this.handleStack = function(item, amount, tile, source) {
        const entity = tile.ent(),
            current = entity.getToggle();
        entity.noSleep();
        if((this.dumpToggle ? current > -1 && this.recs[current].output.items.some(a => a.item == item) : this.outputItemSet.contains(item)) && !entity.items.has(item)) entity.getToOutputItemSet().add(item);
        entity.items.add(item, amount);
    }
    //displays whether input is enough
    this.displayConsumption = function(tile, table) {
        const entity = tile.ent();
        var z = 0;
        var y = 0;
        var x = 0;
        var recLen = this.recs.length;
        table.left();
        //input 아이템, 액체 그림 띄우기
        for(var i = 0; i < recLen; i++) {
            var items = this.recs[i].input.items;
            var liquids = this.recs[i].input.liquids;
            //아이템
            for(var j = 0, len = items.length; j < len; j++) {
                (function(j, items) {
                    table.add(new ReqImage(new ItemImage(items[j].item.icon(Cicon.medium), items[j].amount), boolp(() => entity.items != null && entity.items.has(items[j].item, items[j].amount)))).size(8 * 4);
                })(j, items);
            }
            z += len;
            //액체
            for(var l = 0, len = liquids.length; l < len; l++) {
                (function(l, liquids) {
                    table.add(new ReqImage(new ItemImage(liquids[l].liquid.icon(Cicon.medium), liquids[l].amount), boolp(() => entity.liquids != null && entity.liquids.get(liquids[l].liquid) > liquids[l].amount))).size(8 * 4);
                })(l, liquids);
            }
            z += len;
            //아이템 유뮤 바에서 레시피 구분및 자동 줄바꿈을 위해 정리된 input item 필요.
            if(z == 0) {
                table.addImage(Icon.cancel).size(8 * 4);
                x += 1;
            }
            if(i < recLen - 1) {
                var next = this.recs[i + 1].input;
                y += next.items.length + next.liquids.length;
                x += z;
                if(x + y <= 7 && y != 0) {
                    table.addImage(Icon.pause).size(8 * 4);
                    x += 1;
                } else if(x + y <= 6 && y == 0) {
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
    };
    this.displayInfo = function(table) {
        this.super$displayInfo(table);
        var recLen = this.recs.length;
        for(var i = 0; i < recLen; i++) {
            var rec = this.recs[i];
            var outputItems = rec.output.items,
                inputItems = rec.input.items;
            var outputLiquids = rec.output.liquids,
                inputLiquids = rec.input.liquids;
            var inputPower = this.recs[i].input.power,
                outputPower = this.recs[i].output.power;
            table.table(this.infoStyle.up, cons(part => {
                part.add("[accent]" + BlockStat.input.localized()).expandX().left().row();
                part.table(cons(row => {
                    for(var l = 0, len = inputItems.length; l < len; l++) row.add(new ItemDisplay(inputItems[l].item, inputItems[l].amount, true)).padRight(5);
                })).left().row();
                part.table(cons(row => {
                    for(var l = 0, len = inputLiquids.length; l < len; l++) row.add(new LiquidDisplay(inputLiquids[l].liquid, inputLiquids[l].amount, false));
                })).left().row();
                if(inputPower > 0) {
                    part.table(cons(row => {
                        row.add("[lightgray]" + BlockStat.powerUse.localized() + ":[]").padRight(4);
                        (new NumberValue(inputPower * 60, StatUnit.powerSecond)).display(row);
                    })).left().row();
                }
                part.add("[accent]" + BlockStat.output.localized()).left().row();
                part.table(cons(row => {
                    for(var jj = 0, len = outputItems.length; jj < len; jj++) row.add(new ItemDisplay(outputItems[jj].item, outputItems[jj].amount, true)).padRight(5);
                })).left().row();
                part.table(cons(row => {
                    for(var jj = 0, len = outputLiquids.length; jj < len; jj++) row.add(new LiquidDisplay(outputLiquids[jj].liquid, outputLiquids[jj].amount, false));
                })).left().row();
                if(outputPower) {
                    part.table(cons(row => {
                        row.add("[lightgray]" + BlockStat.basePowerGeneration.localized() + ":[]").padRight(4);
                        (new NumberValue(outputPower, StatUnit.powerSecond)).display(row);
                    })).left().row();
                }
                part.table(cons(row => {
                    row.add("[lightgray]" + BlockStat.productionTime.localized() + ":[]").padRight(4);
                    (new NumberValue(rec.craftTime / 60, StatUnit.seconds)).display(row);
                })).left().row();
                if(typeof this["customDisplay"] === "function") this.customDisplay(part, i);
            })).color(Pal.accent).left().growX();
            table.add().size(18).row();
        }
    };
    //for dislpying info
    this.setStats = function() {
        this.super$setStats();
        if(this.powerBarI) this.stats.remove(BlockStat.powerUse);
        this.stats.remove(BlockStat.productionTime);
    };
    //for displaying bars
    this.setBars = function() {
        this.super$setBars();
        //initialize
        this.bars.remove("liquid");
        this.bars.remove("items");
        if(!this.powerBarI) this.bars.remove("power");
        if(this.powerBarO) this.bars.add("poweroutput", func(entity => new Bar(prov(() => Core.bundle.format("bar.poweroutput", entity.block.getPowerProduction(entity.tile) * 60 * entity.timeScale)), prov(() => Pal.powerBar), floatp(() => typeof entity["getPowerStat"] === "function" ? entity.getPowerStat() : 0))));
        //display every Liquids that can contain
        var i = 0;
        if(!this.liquidSet.isEmpty()) {
            this.liquidSet.each(cons(k => {
                this.bars.add("liquid" + i, func(entity => new Bar(prov(() => k.localizedName), prov(() => k.barColor()), floatp(() => entity.liquids.get(k) / this.liquidCapacity))));
                i++;
            }));
        }
    };
    //for progress
    this.getProgressIncreaseA = function(entity, i, baseTime) {
        //when use power
        if(this.recs[i].input.power > 0) return this.getProgressIncrease(entity, baseTime);
        else return 1 / baseTime * entity.delta();
    };
    //acutal power prodcution
    this.getPowerProduction = function(tile) {
        const entity = tile.ent();
        var i = entity.getToggle();
        if(i < 0) return 0;
        var oPower = this.recs[i].output.power;
        if(oPower > 0 && entity.getCond()) {
            if(this.recs[i].input.power > 0) {
                entity.setPowerStat(entity.efficiency());
                return oPower * entity.efficiency();
            } else {
                entity.setPowerStat(1);
                return oPower;
            }
        }
        entity.setPowerStat(0);
        return 0;
    };
    //custom function that add or remove items when progress is ongoing.
    this.customProd = function(tile, i) {
        const entity = tile.ent();
        //consume items
        var inputItems = this.recs[i].input.items;
        var inputLiquids = this.recs[i].input.liquids;
        var outputItems = this.recs[i].output.items;
        var outputLiquids = this.recs[i].output.liquids;
        var eItems = entity.items;
        var eLiquids = entity.liquids;
        for(var k = 0, len = inputItems.length; k < len; k++) eItems.remove(inputItems[k]);
        //consume liquids
        for(var j = 0, len = inputLiquids.length; j < len; j++) eLiquids.remove(inputLiquids[j].liquid, inputLiquids[j].amount);
        //produce items
        for(var a = 0, len = outputItems.length; a < len; a++) {
            this.useContent(tile, outputItems[a].item);
            for(var aa = 0, amount = outputItems[a].amount; aa < amount; aa++) {
                var oItem = outputItems[a].item;
                eItems.add(oItem, 1);
                if(!this.tryDump(tile, oItem) && eItems.get(oItem) == 1) entity.getToOutputItemSet().add(oItem);
            }
        }
        //produce liquids
        for(var j = 0, len = outputLiquids.length; j < len; j++) {
            var oLiquid = outputLiquids[j].liquid;
            this.useContent(tile, oLiquid);
            if(eLiquids.get(oLiquid) <= 0.001) entity.getToOutputLiquidSet().add(oLiquid);
            this.handleLiquid(tile, tile, oLiquid, outputLiquids[j].amount);
        }
        Effects.effect(this.craftEffect, tile.drawx(), tile.drawy());
        entity.progress = 0;
    };
    this.shouldIdleSound = function(tile) {
        return tile.entity.getCond();
    };
    //update. called every tick
    this.update = function(tile) {
        const entity = tile.ent();
        if(entity.timer.get(1, 60)) {
            var i = 0;
            entity.items.forEach(new ItemModule.ItemConsumer() {
                accept: (item, amount) => {
                    i++;
                }
            });
            entity.setItemHas(i);
        }
        var recLen = this.recs.length;
        var current = entity.getToggle();
        //to not rewrite whole update
        if(typeof this["customUpdate"] === "function") this.customUpdate(tile);
        //calls customCons and customProd
        if(current >= 0) {
            this.customCons(tile, current);
            if(entity.progress >= 1) this.customProd(tile, current);
        }
        var eItems = entity.items;
        var eLiquids = entity.liquids;
        //dump
        if(this.dumpToggle && current == -1) return;
        var que = entity.getToOutputItemSet().orderedItems(),
            len = que.size,
            itemEntry = entity.getDumpItemEntry();
        if(entity.timer.get(this.dumpTime) && len > 0) {
            for(var i = 0; i < len; i++) {
                var candidate = que.get((i + itemEntry) % len);
                if(this.tryDump(tile, candidate)) {
                    if(!eItems.has(candidate)) entity.getToOutputItemSet().remove(candidate);
                    break;
                }
            }
            if(i != len) entity.setDumpItemEntry((i + itemEntry) % len);
        }
        var que = entity.getToOutputLiquidSet().orderedItems(),
            len = que.size;
        if(len > 0) {
            for(var i = 0; i < len; i++) {
                var liquid = que.get(i);
                this.tryDumpLiquid(tile, liquid);
                if(eLiquids.get(liquid) <= 0.001) entity.getToOutputLiquidSet().remove(liquid);
            }
        }
    };
    //initialize
    this.init = function() {
        for(var i = 0; i < this.tmpRecs.length; i++) {
            var tmp = this.tmpRecs[i];
            var isInputExist = tmp.input != null,
                isOutputExist = tmp.output != null;
            var tmpInput = tmp.input;
            var tmpOutput = tmp.output;
            if(isInputExist && tmpInput.power > 0) this.powerBarI = true;
            if(isOutputExist && tmpOutput.power > 0) this.powerBarO = true;
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
            if(isInputExist) {
                if(tmpInput.items != null) {
                    for(var j = 0, len = tmpInput.items.length; j < len; j++) {
                        if(typeof tmpInput.items[j] != "string") throw "It is not string at " + j + "th input item in " + i + "th recipe";
                        var words = tmpInput.items[j].split("/");
                        if(words.length != 2) throw "Malform at " + j + "th input item in " + i + "th recipe";
                        var item = vc.getByName(ci, words[0]);
                        if(item == null) throw "Invalid item: " + words[0] + " at " + j + "th input item in " + i + "th recipe";
                        this.inputItemSet.add(item);
                        if(isNaN(words[1])) throw "Invalid amount: " + words[1] + " at " + j + "th input item in " + i + "th recipe";
                        realInput.items[j] = new ItemStack(item, words[1] * 1);
                    }
                }
                if(tmpInput.liquids != null) {
                    for(var j = 0, len = tmpInput.liquids.length; j < len; j++) {
                        if(typeof tmpInput.liquids[j] != "string") throw "It is not string at " + j + "th input liquid in " + i + "th recipe";
                        var words = tmpInput.liquids[j].split("/");
                        if(words.length != 2) throw "Malform at " + j + "th input liquid in " + i + "th recipe";
                        var liquid = vc.getByName(cl, words[0]);
                        if(liquid == null) throw "Invalid liquid: " + words[0] + " at " + j + "th input liquid in " + i + "th recipe";
                        this.inputLiquidSet.add(liquid);
                        this.liquidSet.add(liquid);
                        if(isNaN(words[1])) throw "Invalid amount: " + words[1] + " at " + j + "th input liquid in " + i + "th recipe";
                        realInput.liquids[j] = new LiquidStack(liquid, words[1] * 1);
                    }
                }
            }
            if(isOutputExist) {
                if(tmpOutput.items != null) {
                    for(var j = 0, len = tmpOutput.items.length; j < len; j++) {
                        if(typeof tmpOutput.items[j] != "string") throw "It is not string at " + j + "th output item in " + i + "th recipe";
                        var words = tmpOutput.items[j].split("/");
                        if(words.length != 2) throw "Malform at " + j + "th output item in " + i + "th recipe"
                        var item = vc.getByName(ci, words[0]);
                        if(item == null) throw "Invalid item: " + words[0] + " at " + j + "th output item in " + i + "th recipe";
                        this.outputItemSet.add(item);
                        if(isNaN(words[1])) throw "Invalid amount: " + words[1] + " at " + j + "th output item in " + i + "th recipe";
                        realOutput.items[j] = new ItemStack(item, words[1] * 1);
                    }
                    if(j != 0) this.hasOutputItem = true;
                }
                if(tmpOutput.liquids != null) {
                    for(var j = 0, len = tmpOutput.liquids.length; j < len; j++) {
                        if(typeof tmpOutput.liquids[j] != "string") throw "It is not string at " + j + "th output liquid in " + i + "th recipe";
                        var words = tmpOutput.liquids[j].split("/");
                        if(words.length != 2) throw "Malform at " + j + "th output liquid in " + i + "th recipe";
                        var liquid = vc.getByName(cl, words[0]);
                        if(liquid == null) throw "Invalid liquid: " + words[0] + " at " + j + "th output liquid in " + i + "th recipe";
                        this.outputLiquidSet.add(liquid);
                        this.liquidSet.add(liquid);
                        if(isNaN(words[1])) throw "Invalid amount: " + words[1] + " at " + j + "th output liquid in " + i + "th recipe";
                        realOutput.liquids[j] = new LiquidStack(liquid, words[1] * 1);
                    }
                }
            }
        }
        if(!this.powerBarI) {
            this.consumes.remove(ConsumeType.power);
            this.hasPower = false;
        }
        this.consumesPower = this.powerBarI;
        this.outputsPower = this.powerBarO;
        this.super$init();
        if(!this.outputLiquidSet.isEmpty()) this.outputsLiquid = true;
        this.timers++;
        if(!Vars.headless) this.infoStyle = Core.scene.getStyle(Button.ButtonStyle);
    };
    this.updateTableAlign = function(tile, table) {
        var pos = Core.input.mouseScreen(tile.drawx(), tile.drawy() - this.size * 4 - 1).y;
        var relative = Core.input.mouseScreen(tile.drawx(), tile.drawy() + this.size * 4);
        table.setPosition(relative.x, Math.min(pos, relative.y - Math.ceil(tile.ent().getItemHas() / 3) * 48 - 4), Align.top);
        if(!this.invFrag.isShown() && Vars.control.input.frag.config.getSelectedTile() == tile && tile.entity.items.total() > 0) this.invFrag.showFor(tile);
    };
    //show config menu
    this.buildConfiguration = function(tile, table) {
        const entity = tile.ent();
        if(!this.invFrag.isBuilt()) this.invFrag.build(table.getParent());
        if(this.invFrag.isShown()) {
            this.invFrag.hide();
            Vars.control.input.frag.config.hideConfig();
            return;
        }
        var group = new ButtonGroup();
        group.setMinCheckCount(0);
        group.setMaxCheckCount(1);
        var recLen = this.recs.length;
        for(var i = 0; i < recLen; i++) {
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
        for(var l = 0; l < recLen; l++) {
            var output = this.recs[l].output;
            var outputItemLen = output.items.length;
            var outputLiquidLen = output.liquids.length;
            if(lengths[l] == null) lengths[l] = [0, 0, 0];
            if(outputItemLen > 0) lengths[l][0] = outputItemLen - 1;
            if(outputLiquidLen > 0) {
                if(outputItemLen > 0) lengths[l][1] = outputLiquidLen;
                else lengths[l][1] = outputLiquidLen - 1;
            }
            if(output.power > 0) lengths[l][2] = 1;
        }
        for(var i = 0; i < recLen; i++) {
            max = max < lengths[i][0] + lengths[i][1] + lengths[i][2] ? lengths[i][0] + lengths[i][1] + lengths[i][2] : max;
        }
        for(var i = 0; i < max; i++) {
            for(var j = 0; j < recLen; j++) {
                var output = this.recs[j].output;
                var outputItemLen = output.items.length;
                var outputLiquidLen = output.liquids.length;
                if(lengths[j][0] > 0) {
                    table.addImage(output.items[outputItemLen - lengths[j][0]].item.icon(Cicon.small));
                    lengths[j][0]--;
                } else if(lengths[j][1] > 0) {
                    table.addImage(output.liquids[outputLiquidLen - lengths[j][1]].liquid.icon(Cicon.small));
                    lengths[j][1]--;
                } else if(lengths[j][2] > 0) {
                    if(output.items[0] != null || output.liquids[0] != null) {
                        table.addImage(Icon.power);
                    } else table.addImage(Tex.clear);
                    lengths[j][2]--;
                } else {
                    table.addImage(Tex.clear);
                }
            }
            table.row();
        }
    };
    //save which buttons is pressed
    this.configured = function(tile, player, value) {
        const entity = tile.ent();
        //save current progress.
        if(entity.getToggle() >= 0) entity.saveProgress(entity.getToggle(), entity.progress);
        if(value == -1) entity.saveCond(false);
        if(this.dumpToggle) {
            entity.getToOutputItemSet().clear();
            entity.getToOutputLiquidSet().clear();
            if(value > -1) {
                var oItems = this.recs[value].output.items;
                var oLiquids = this.recs[value].output.liquids;
                for(var i = 0, len = oItems.length; i < len; i++) {
                    var item = oItems[i].item;
                    if(entity.items.has(item)) entity.getToOutputItemSet().add(item);
                }
                for(var i = 0, len = oLiquids.length; i < len; i++) {
                    var liquid = oLiquids[i].liquid;
                    if(entity.liquids.get(liquid) > 0.001) entity.getToOutputLiquidSet().add(liquid);
                }
            }
        }
        entity.progress = 0;
        entity.setToggle(value);
    };
    this.onConfigureTileTapped = function(tile, other) {
        if(tile != other) this.invFrag.hide();
        return tile.entity.items.total() > 0 ? true : tile != other;
    };
    this.removed = function(tile) {
        this.invFrag.hide();
    };
    this.doDumpToggle = function() {
        return this.dumpToggle;
    };
};

function MultiCrafterEntity() {
    //버튼 눌린거 저장
    this.setToggle = function(a) {
        this._toggle = a;
    };
    this.getToggle = function() {
        return this._toggle;
    };
    this._toggle = 0;
    //버튼 바꼈을때 진행상황 저장
    this.saveProgress = function(c, d) {
        this._progressArr[c] = d;
    };
    this.getProgress = function(e) {
        return this._progressArr[e];
    };
    this._progressArr = [];
    //현재 생산 중인지 저장
    this.saveCond = function(f) {
        this._cond = f;
    };
    this.getCond = function() {
        return this._cond;
    };
    this._cond = false;
    //전력 출력 바 용 현재 전력출력상황
    this.setPowerStat = function(g) {
        this._powerStat = g;
    };
    this.getPowerStat = function() {
        return this._powerStat;
    };
    this._powerStat = 0;
    this._toOutputItemSet = new OrderedSet();
    this.getToOutputItemSet = function() {
        return this._toOutputItemSet;
    };
    this._toOutputLiquidset = new OrderedSet();
    this.getToOutputLiquidSet = function() {
        return this._toOutputLiquidset;
    };
    this._dumpItemEntry = 0;
    this.getDumpItemEntry = function() {
        return this._dumpItemEntry;
    };
    this.setDumpItemEntry = function(a) {
        this._dumpItemEntry = a;
    };
    //
    this._itemHas = 0;
    this.getItemHas = function() {
        return this._itemHas;
    };
    this.setItemHas = function(a) {
        this._itemHas = a;
    };
    //_toOutputItemSet= new OrderedSet();
    this.config = function() {
        return this._toggle;
    };
    this.write = function(stream) {
        this.super$write(stream);
        stream.writeShort(this._toggle);
        var queItem = this._toOutputItemSet.orderedItems(),
            len = queItem.size;
        stream.writeByte(len);
        for(var i = 0; i < len; i++) stream.writeByte(queItem.get(i).id);
        var queLiquid = this._toOutputLiquidset.orderedItems(),
            len = queLiquid.size;
        stream.writeByte(len);
        for(var i = 0; i < len; i++) stream.writeByte(queLiquid.get(i).id);
    };
    this.read = function(stream, revision) {
        this.super$read(stream, revision);
        this._toggle = stream.readShort();
        this._toOutputItemSet.clear();
        this._toOutputLiquidset.clear();
        var len = stream.readByte(),
            vc = Vars.content,
            ci = ContentType.item,
            cl = ContentType.liquid;
        for(var i = 0; i < len; i++) this._toOutputItemSet.add(vc.getByID(ci, stream.readByte()));
        var len = stream.readByte();
        for(var i = 0; i < len; i++) this._toOutputLiquidset.add(vc.getByID(cl, stream.readByte()));
    };
}
module.exports = {
    MultiCrafter: MultiCrafter,
    MultiCrafterEntity: MultiCrafterEntity
}
