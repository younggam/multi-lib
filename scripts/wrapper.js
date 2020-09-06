const lib = require("multi-lib2/library");

function cloneObject(obj) {
    var clone = {};
    for (var i in obj) {
        if (typeof(obj[i]) == "object" && obj[i] != null) clone[i] = cloneObject(obj[i]);
        else clone[i] = obj[i];
    }
    return clone;
}
module.exports = {
    extend(Type, name, recipes, def, Entity) {
        const block = Object.create(lib.body);
        Object.assign(block, def);
        const multi = extendContent(Type, name, block);
        multi.entityType = prov(() => extend(GenericCrafter.GenericCrafterEntity, Object.assign({
            //버튼 눌린거 저장
            setToggle(a) {
                this._toggle = a;
            },
            getToggle() {
                return this._toggle;
            },
            _toggle: 0,
            //버튼 바꼈을때 진행상황 저장
            saveProgress(c, d) {
                this._progressArr[c] = d;
            },
            getProgress(e) {
                return this._progressArr[e];
            },
            _progressArr: [],
            //현재 생산 중인지 저장
            saveCond(f) {
                this._cond = f;
            },
            getCond() {
                return this._cond;
            },
            _cond: false,
            //전력 출력 바 용 현재 전력출력상황
            setPowerStat(g) {
                this._powerStat = g;
            },
            getPowerStat() {
                return this._powerStat;
            },
            _powerStat: 0,
            //
            _itemHas:0,
            getItemHas(){
                return this._itemHas;
            },
            setItemHas(a){
                this._itemHas=a;
            },
            config() {
                return this._toggle;
            },
            write(stream) {
                this.super$write(stream);
                stream.writeShort(this._toggle);
            },
            read(stream, revision) {
                this.super$read(stream, revision);
                this._toggle = stream.readShort();
            }
        }, cloneObject(Entity))));
        multi.consumes.add(extend(ConsumePower, {
            requestedPower(entity) {
                if (typeof entity["getToggle"] !== "function") return 0;
                var i = entity.getToggle();
                if (i < 0) return 0;
                var input = entity.block.getRecipes()[i].input.power;
                if (input > 0 && entity.getCond()) return input;
                return 0;
            }
        }));
        //별개 값
        multi.configurable = true;
        multi.hasItems = true;
        multi.hasLiquids = true;
        multi.hasPower = true;
        multi.recs = [];
        multi.liquidSet = new ObjectSet();
        multi.dumpToggle = false;
        multi.hasOutputItem = false;
        multi.inputItemSet = new ObjectSet();
        multi.inputLiquidSet = new ObjectSet();
        multi.outputItemSet = new ObjectSet();
        multi.outputLiquidSet = new ObjectSet();
        multi.powerBarI = false;
        multi.powerBarO = false;
        multi.tmpRecs = recipes
        return multi;
    }
};
