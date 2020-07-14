import { _decorator, Component, Node, ColliderComponent, ITriggerEvent, ButtonComponent, EventHandler } from 'cc';
const { ccclass, property, menu, requireComponent } = _decorator;

@ccclass('Trigger')
@menu("格子/触发器")
@requireComponent(ColliderComponent)
export class Trigger extends Component {

    @property({
        type: EventHandler,
        displayName: "触发开始"
    })
    onTriggerEnterEvents: EventHandler[] = [];

    @property({
        type: EventHandler,
        displayName: "触发持续"
    })
    onTriggerStayEvents: EventHandler[] = [];

    @property({
        type: EventHandler,
        displayName: "触发结束"
    })
    onTriggerExitEvents: EventHandler[] = [];

    @property({
        type: EventHandler,
        displayName: "碰撞开始"
    })
    onCollisionEnterEvents: EventHandler[] = [];

    @property({
        type: EventHandler,
        displayName: "碰撞持续"
    })
    onCollisionStayEvents: EventHandler[] = [];

    @property({
        type: EventHandler,
        displayName: "碰撞结束"
    })
    onCollisionExitEvents: EventHandler[] = [];

    protected collider: ColliderComponent = null;
    onLoad() {
        this.collider = this.getComponent(ColliderComponent);
        this.collider.on('onTriggerEnter', this.onTriggerEnter, this);
        this.collider.on('onTriggerStay', this.onTriggerStay, this);
        this.collider.on('onTriggerExit', this.onTriggerExit, this);
        this.collider.on('onCollisionEnter', this.onCollisionEnter, this);
        this.collider.on('onCollisionStay', this.onCollisionStay, this);
        this.collider.on('onCollisionExit', this.onCollisionExit, this);

        this.getComponent(ButtonComponent)
    }

    protected sendEvent(handlers: EventHandler[], params: any[]) {
        for (let v of handlers) {
            v.emit(params);
        }
    }

    protected onTriggerEnter(event: ITriggerEvent) {
        this.sendEvent(this.onTriggerEnterEvents, [event]);
    }
    protected onTriggerStay(event: ITriggerEvent) {
        this.sendEvent(this.onTriggerStayEvents, [event]);
    }
    protected onTriggerExit(event: ITriggerEvent) {
        this.sendEvent(this.onTriggerExitEvents, [event]);
    }
    protected onCollisionEnter(event: ITriggerEvent) {
        this.sendEvent(this.onCollisionEnterEvents, [event]);
    }
    protected onCollisionStay(event: ITriggerEvent) {
        this.sendEvent(this.onCollisionStayEvents, [event]);
    }
    protected onCollisionExit(event: ITriggerEvent) {
        this.sendEvent(this.onCollisionExitEvents, [event]);
    }
}
