import {FilterInputType, FilterType} from "../packets/AssetFilters/FilterTypes";
import {FilterMetaData} from "../packets/AssetFilters/FilterMetaDataPackets";
import {CuckooFilter} from "./filterModules/CuckooFilter";
import {getFilterCRC} from "../util/FilterUtil";


export class AssetFilter {

  filterType = FilterType.CUCKCOO_V1;
  metaData : FilterMetaData;
  filter   : CuckooFilter = null;

  internalBuffer = [];

  constructor(metaData: FilterMetaData) {
    this.metaData = metaData;
  }


  /**
   * Add your data to the filter. This data is normally ordered. The
   * @param data
   */
  addToFilter(data: Buffer) {
    // we construct a filter when we need the filterData or CRC. If we add more, the cached version is invalid.
    if (this.filter !== null) {
      this.filter = null;
    }
    this.internalBuffer.push(data);
  }


  /**
   * This packet is what will be transferred to a Crownstone. It is the full byte representation of the filter.
   */
  getFilterPacket() : Buffer {
    this._buildFilter();
    let filterPacket = Buffer.concat([this.metaData.getPacket(), this.filter.getPacket()])
    return filterPacket;
  }


  /**
   * Get the CRC of this filter
   */
  getCRC() : number {
    this._buildFilter();
    return getFilterCRC(this.metaData, this.filter.getPacket());
  }

  _buildFilter() {
    if (this.filter === null) {
      this.filter = new CuckooFilter(this.internalBuffer.length);

      // load the data into the filters. If the input is a mac address we have to treat it differently.
      if (this.metaData.input.type === FilterInputType.MAC_ADDRESS) {
        for (let dataItem of this.internalBuffer) {
          // MAC addresses are reversed over the air. The firmware will not rotate all of them, so we do it here.
          dataItem.reverse();
          this.filter.add(dataItem);
        }
      }
      else {
        for (let dataItem of this.internalBuffer) {
          this.filter.add(dataItem);
        }
      }
    }
  }
}