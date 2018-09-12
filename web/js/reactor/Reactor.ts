import {Preconditions} from '../Preconditions';
import {Event} from './Event';
import {Listener} from './Listener';
import {Logger} from '../logger/Logger';

const log = Logger.create();

export class Reactor<V> implements IReactor<V> {

    private readonly events: {[name: string]: Event<V>} = {};

    public registerEvent(eventName: string): this {

        Preconditions.assertNotNull(eventName, "eventName");

        if (this.events[eventName]) {
            // already registered so don't double register which would kill
            // the existing listeners.
            return this;
        }

        const event = new Event<V>(eventName);
        this.events[eventName] = event;

        return this;

    }

    public eventNames(): string[] {
        return Object.keys(this.events);
    }

    public clearEvent(eventName: string) {
        // replace it with a new event to clear the previous listeners.
        const event = new Event<V>(eventName);
        this.events[eventName] = event;
        return this;
    }

    /**
     *
     * @param eventName The name of the event to dispatch.
     * @param value The event value to dispatch to listeners of that event name.
     * @return {Reactor}
     */
    public dispatchEvent(eventName: string, value: V) {

        Preconditions.assertNotNull(eventName, "eventName");

        const event = this.events[eventName];

        if (! event) {
            throw new Error("No events for event name: " + eventName);
        }

        event.getListeners().forEach((listener) => {

            try {

                listener(value);

            } catch (e) {
                log.error("listener generated unhandled exception: ", e);
            }

        });

        return this;

    }

    /**
     *
     */
    public addEventListener(eventName: string, listener: Listener<V>) {

        Preconditions.assertNotNull(eventName, "eventName");

        if (typeof listener !== "function") {
            throw new Error("listener is not a function: " + typeof listener);
        }

        if (this.events[eventName] === undefined) {
            throw new Error("No registered event for event name: " + eventName);
        }

        this.events[eventName].registerListener(listener);
        return this;

    }

    public removeEventListener(eventName: string, listener: Listener<V>): boolean {

        if (this.events[eventName]) {
            return this.events[eventName].removeListener(listener);
        }

        return false;

    }

    public once(eventName: string): Promise<V> {

        return new Promise<V>((resolve => {

            const listener = (event: V) => {
                resolve(event);
                this.removeEventListener(eventName, listener);
            };

            this.addEventListener(eventName, listener);

        }));

    }

    /**
     *
     * @param eventName {String} The name of the event for the listeners.
     * @return {Array}
     */
    public getEventListeners(eventName: string) {
        Preconditions.assertNotNull(eventName, "eventName");

        return this.events[eventName].getListeners();
    }

}

export interface IReactor<V> {
    once(eventName: string): Promise<V>;
}
