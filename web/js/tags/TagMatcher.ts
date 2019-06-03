import {Tag} from './Tag';
import {TagIDStr} from './Tag';
import {Tags} from './Tags';
import {Sets} from '../util/Sets';
import {TagPaths} from './TagPaths';


export class TagMatcher {

    private readonly docTagPairs: TagPairs;

    public constructor(public readonly queryTagPairs: TagPairs,
                       public readonly docTags: readonly Tag[]) {

        this.docTagPairs = new TagPairs(this.docTags);

    }

    public matches() {
        return this.matchesFolders() && this.matchesTags();
    }

    /**
     * See if any of the given docTags is within a folder (has a prefix) of the
     * given tags.
     *
     * For example:
     *
     * tags: /linux
     * docTags: /linux
     *
     * Would match as it's an exact match.
     *
     * tags: /linux
     * docTags: /linux/debian
     *
     * Would match as tags is a directory prefix.
     *
     *
     */
    public matchesFolders(): boolean {

        const queryTagIDs = this.queryTagPairs.folderTags.tagIDs;
        const docTagIDs = this.docTagPairs.folderTags.tagIDs;

        const index: {[path: string]: boolean} = {};

        for (const docTagID of docTagIDs) {
            const pathEntries = TagPaths.createPathEntries(docTagID);

            for (const pathEntry of pathEntries) {
                index[pathEntry.path] = true;
            }

        }

        for (const queryTagID of queryTagIDs) {
            if (index[queryTagID]) {
                return true;
            }
        }

        return false;

    }
    public matchesTags(): boolean {

        const queryTagIDs = this.queryTagPairs.regularTags.tagIDs;
        const docTagIDs = this.docTagPairs.regularTags.tagIDs;

        if (docTagIDs.length === 0) {
            // the document we're searching over has no tags.
            return false;
        }

        if (queryTagIDs.length === 0) {
            // we have no query tags
            return false;
        }

        // TODO: this would be 'or' but we don't yet have 'AND'
        // const docTagSet = new Set(Tags.toIDs(docTags));
        //
        // for (const tag of tags) {
        //     if (docTagSet.has(tag.id)) {
        //         return true;
        //     }
        // }

        const intersection =
            Sets.intersection(queryTagIDs, docTagIDs);

        return intersection.length === queryTagIDs.length;

    }

}

class TagPairs {

    public readonly folderTags: FolderTags;
    public readonly regularTags: RegularTags;

    constructor(public readonly tags: readonly Tag[]) {
        this.folderTags = new FolderTags(Tags.onlyFolderTags(this.tags));
        this.regularTags = new FolderTags(Tags.onlyRegular(this.tags));
    }

}

class TypedTags {

    public readonly tagIDs: readonly TagIDStr[];

    constructor(public readonly tags: readonly Tag[]) {
        this.tagIDs = Tags.toIDs(this.tags);
    }

}

class FolderTags extends TypedTags {

    constructor(tags: ReadonlyArray<Tag>) {
        super(tags);
    }
}

class RegularTags extends TypedTags {

}

/**
 * Used so we're not constantly migrating tags to IDs and we keep an index
 * of the document while we work with it to avoid wasteful operations.
 */
export class TagMatcherFactory {

    private queryTagPairs: TagPairs;

    public constructor(public readonly tags: readonly Tag[]) {
        this.queryTagPairs = new TagPairs(this.tags);
    }

    public create(docTags: readonly Tag[]) {
        return new TagMatcher(this.queryTagPairs, docTags);
    }

}
