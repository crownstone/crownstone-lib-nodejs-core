import {FilterSummaries, FilterSummary} from "../packets/AssetFilters/FilterPackets";
import {FilterMetaData} from "../packets/AssetFilters/FilterMetaDataPackets";


export interface FilterData {
  idOnCrownstone: number,
  crc:            number,
  metaData:       FilterMetaData,
  filter:         Buffer
}

export interface FilterSycingCommunicationInterface {
  getSummaries: () => Promise<FilterSummaries>,
  remove: (protocol: number, filterId: number) => Promise<void>,
  upload: (protocol: number, filterData: FilterData) => Promise<void>,
  commit: (protocol: number) => Promise<void>,
}

export interface FilterSyncingTargetData {
  masterVersion: number,
  masterCRC:     number,
  filters:       FilterData[]
}


export class FilterSyncer {

  com  : FilterSycingCommunicationInterface;
  data : FilterSyncingTargetData;

  constructor(communicationInterface : FilterSycingCommunicationInterface, newData: FilterSyncingTargetData) {
    this.com  = communicationInterface;
    this.data = newData;
  }

  async syncToCrownstone() {
    let summaries = await this.com.getSummaries();
    let protocol = summaries.supportedFilterProtocol;
    if (summaries.masterVersion > this.data.masterVersion) {
      throw "TARGET_HAS_HIGHER_VERSION";
    }

    if (summaries.masterVersion === this.data.masterVersion) {
      if (summaries.masterCRC !== this.data.masterCRC) {
        throw "TARGET_HAS_SAME_VERSION_DIFFERENT_CRC";
      }
      else {
        // Sync not required! Jey!
        return;
      }
    }

    // here we know the version on the crownstone is lower than the one we want to put on it.
    // start sync.
    let filtersToDelete : number[]  = [];
    let filtersToAdd : FilterData[] = [];
    for (let filterSummary of summaries.filterSummaries) {
      let matchingFilter = searchForIdInTargetData(filterSummary.filterId, this.data.filters);
      if (matchingFilter === null) {
        filtersToDelete.push(filterSummary.filterId);
      }
      else if (filterSummary.filterCRC !== matchingFilter.crc) {
        filtersToDelete.push(filterSummary.filterId);
      }
      else {
        // if the ID and the CRC match, we're done with this one. Next!
        continue;
      }
    }

    // check which filters from the set want to be on the Crownstone have to be uploaded.
    for (let filterData of this.data.filters) {
      if (filtersToDelete.indexOf(filterData.idOnCrownstone) !== -1) {
        // the filter with this id will be removed. Add it after.
        filtersToAdd.push(filterData);
        continue;
      }

      let matchingFilter = searchForIdInCrownstoneData(filterData.idOnCrownstone, summaries.filterSummaries);
      if (matchingFilter === null) {
        filtersToAdd.push(filterData);
        continue;
      }
      // the case where the CRC does not match is already covered by the first check if it's bound to be deleted.
    }

    for (let filterId of filtersToDelete) {
      await this.com.remove(protocol, filterId);
    }
    for (let filterData of filtersToAdd) {
      await this.com.upload(protocol, filterData);
    }

    return this.com.commit(protocol);
  }
}

function searchForIdInCrownstoneData(id: number, filters: FilterSummary[]) : FilterSummary | null {
  for (let filter of filters) {
    if (filter.filterId === id) {
      return filter;
    }
  }
  return null;
}

function searchForIdInTargetData(id: number, filters: FilterData[]) : FilterData | null {
  for (let filter of filters) {
    if (filter.idOnCrownstone === id) {
      return filter;
    }
  }
  return null;
}